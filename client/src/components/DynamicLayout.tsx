import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface DynamicLayoutProps {
  content: string;
  className?: string;
}

/**
 * Renders markdown content with GFM (tables, task lists). Use for analysis reports:
 * sentiment, product ideas, key questions. Tables get a clean header and zebra stripes.
 */
export function DynamicLayout({ content, className = "" }: DynamicLayoutProps) {
  return (
    <div className={["prose prose-slate max-w-none dark:prose-invert", className].filter(Boolean).join(" ")}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ node, ...props }) => <h1 className="text-2xl font-bold text-foreground mb-3" {...props} />,
          h2: ({ node, ...props }) => (
            <h2 className="text-xl font-semibold text-foreground mt-6 mb-3 border-l-4 border-primary pl-3" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-lg font-medium text-muted-foreground mt-4 mb-2 uppercase tracking-wider" {...props} />
          ),
          table: ({ node, ...props }) => (
            <div className="my-4 overflow-x-auto rounded-lg border border-border">
              <table className="min-w-full divide-y divide-border" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead className="bg-muted/60 text-left text-xs font-semibold uppercase tracking-wider" {...props} />
          ),
          th: ({ node, ...props }) => (
            <th className="px-4 py-3 border-b border-border text-foreground" {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="px-4 py-3 text-sm border-b border-border text-foreground" {...props} />
          ),
          tr: ({ node, ...props }) => (
            <tr className="even:bg-muted/30 hover:bg-muted/50 transition-colors" {...props} />
          ),
          a: ({ node, ...props }) => (
            <a
              className="text-primary hover:underline font-medium"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            />
          ),
          ul: ({ node, ...props }) => <ul className="list-disc pl-6 my-2 space-y-1" {...props} />,
          li: ({ node, ...props }) => <li className="text-sm" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export default DynamicLayout;
