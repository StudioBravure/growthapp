import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createHash } from 'crypto';

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get('file') as File;
        const ledgerType = formData.get('ledger_type') as string;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }
        if (!ledgerType || !['PF', 'PJ'].includes(ledgerType)) {
            return NextResponse.json({ error: 'Invalid ledger type' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const hashStr = createHash('sha256').update(buffer).digest('hex');
        const size = file.size;
        const mimeType = file.type;
        const originalName = file.name;

        // Check duplicates? (Optional, but good practice). 
        // For now, allow re-upload, just distinct record.

        const timestamp = Date.now();
        const storagePath = `${user.id}/${ledgerType}/imports/${timestamp}_${originalName}`;

        // Upload to 'imports' bucket
        const { error: uploadError } = await supabase.storage
            .from('imports')
            .upload(storagePath, buffer, {
                contentType: mimeType,
                upsert: false
            });

        if (uploadError) {
            // fallback: maybe bucket doesn't exist? 
            console.error("Upload error:", uploadError);
            // Try creating bucket logic? No, just fail.
            return NextResponse.json({ error: 'Upload failed: ' + uploadError.message }, { status: 500 });
        }

        // Insert into DB
        const { data, error: dbError } = await supabase.from('import_file').insert({
            owner_id: user.id,
            owner_email: user.email!,
            ledger_type: ledgerType,
            storage_path: storagePath,
            original_name: originalName,
            mime_type: mimeType,
            size: size,
            sha256_hash: hashStr
        }).select().single();

        if (dbError) {
            console.error("DB Insert error:", dbError);
            return NextResponse.json({ error: 'DB record failed' }, { status: 500 });
        }

        return NextResponse.json({ success: true, file: data });

    } catch (e: any) {
        console.error("Upload Endpoint Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
