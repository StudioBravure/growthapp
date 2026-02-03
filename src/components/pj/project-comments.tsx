
"use client";

import { useProjectComments } from "@/hooks/use-project-comments";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { MessageSquare, Trash2, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function ProjectComments({ projectId }: { projectId: string }) {
    const { comments, loading, createComment, deleteComment } = useProjectComments(projectId);
    const [text, setText] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!text.trim()) return;
        setSubmitting(true);
        try {
            await createComment(text);
            setText("");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-muted-foreground">Carregando comentários...</div>;

    return (
        <Card>
            <CardHeader className="border-b bg-muted/20 pb-4">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" /> Comentários e Observações
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
                {/* Input Area */}
                <div className="flex gap-4">
                    <Avatar className="h-10 w-10">
                        <AvatarFallback>EU</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                        <Textarea
                            placeholder="Escreva uma observação sobre o projeto..."
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            className="min-h-[100px] bg-background"
                        />
                        <div className="flex justify-end">
                            <Button onClick={handleSubmit} disabled={!text.trim() || submitting}>
                                {submitting ? "Enviando..." : "Adicionar Comentário"}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* List */}
                <div className="space-y-6">
                    {comments.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground text-sm border border-dashed rounded-lg bg-muted/10">
                            Nenhum comentário registrado ainda.
                        </div>
                    ) : (
                        comments.map((comment) => (
                            <div key={comment.id} className="flex gap-4 group">
                                <Avatar className="h-8 w-8 mt-1">
                                    <AvatarFallback className="text-xs bg-slate-100 text-slate-600">
                                        {comment.owner_email ? comment.owner_email.substring(0, 2).toUpperCase() : 'US'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-sm text-foreground">
                                                {comment.owner_email}
                                            </span>
                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: ptBR })}
                                            </span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                                            onClick={() => {
                                                if (confirm('Excluir este comentário?')) deleteComment(comment.id);
                                            }}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                    <div className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                                        {comment.body}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
