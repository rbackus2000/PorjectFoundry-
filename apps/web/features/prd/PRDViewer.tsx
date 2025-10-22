"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Card } from "@/components/ui/card";

type PRDViewerProps = {
  content: string;
};

export default function PRDViewer({ content }: PRDViewerProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content,
    editable: false,
    editorProps: {
      attributes: {
        class: "prose prose-slate max-w-none focus:outline-none min-h-[600px] p-6",
      },
    },
  });

  if (!editor) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-border rounded w-3/4"></div>
          <div className="h-4 bg-border rounded w-full"></div>
          <div className="h-4 bg-border rounded w-5/6"></div>
          <div className="h-4 bg-border rounded w-full"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <style dangerouslySetInnerHTML={{__html: `
        .ProseMirror {
          color: hsl(var(--text));
        }
        .ProseMirror h1 {
          font-size: 2.25rem;
          font-weight: 700;
          margin-top: 2rem;
          margin-bottom: 1rem;
          line-height: 2.5rem;
          color: hsl(var(--text));
        }
        .ProseMirror h2 {
          font-size: 1.875rem;
          font-weight: 600;
          margin-top: 1.75rem;
          margin-bottom: 0.875rem;
          line-height: 2.25rem;
          color: hsl(var(--text));
        }
        .ProseMirror h3 {
          font-size: 1.5rem;
          font-weight: 600;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          line-height: 2rem;
          color: hsl(var(--text));
        }
        .ProseMirror p {
          margin-top: 0.75rem;
          margin-bottom: 0.75rem;
          line-height: 1.75rem;
          color: hsl(var(--text));
        }
        .ProseMirror ul,
        .ProseMirror ol {
          padding-left: 1.5rem;
          margin-top: 0.75rem;
          margin-bottom: 0.75rem;
        }
        .ProseMirror li {
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
          color: hsl(var(--text));
        }
        .ProseMirror code {
          background-color: hsl(var(--surface));
          border: 1px solid hsl(var(--border));
          border-radius: 0.25rem;
          padding: 0.125rem 0.375rem;
          font-size: 0.875rem;
          font-family: monospace;
          color: hsl(var(--primary));
        }
        .ProseMirror pre {
          background-color: hsl(var(--surface));
          border: 1px solid hsl(var(--border));
          border-radius: 0.5rem;
          padding: 1rem;
          overflow-x: auto;
          margin-top: 1rem;
          margin-bottom: 1rem;
        }
        .ProseMirror pre code {
          background-color: transparent;
          border: none;
          padding: 0;
          color: hsl(var(--text));
        }
        .ProseMirror blockquote {
          border-left: 4px solid hsl(var(--primary));
          padding-left: 1rem;
          margin-left: 0;
          margin-top: 1rem;
          margin-bottom: 1rem;
          color: hsl(var(--subtext));
          font-style: italic;
        }
        .ProseMirror strong {
          font-weight: 600;
          color: hsl(var(--text));
        }
        .ProseMirror em {
          font-style: italic;
        }
        .ProseMirror a {
          color: hsl(var(--primary));
          text-decoration: underline;
        }
        .ProseMirror hr {
          border: none;
          border-top: 2px solid hsl(var(--border));
          margin-top: 2rem;
          margin-bottom: 2rem;
        }
      `}} />
      <EditorContent editor={editor} />
    </Card>
  );
}
