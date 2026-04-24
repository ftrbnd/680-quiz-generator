"use client";

import "katex/dist/katex.min.css";
import { InlineMath, BlockMath } from "react-katex";

interface LatexTextProps {
  text: string;
}

export function LatexText({ text }: LatexTextProps) {
  const parts = text.split(/(\$\$[\s\S]*?\$\$)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("$$") && part.endsWith("$$")) {
          const math = part.slice(2, -2);
          return <BlockMath key={i} math={math} />;
        }
        // Inline math: $...$
        const inlineParts = part.split(/(\$[^$]+\$)/g);
        return (
          <span key={i}>
            {inlineParts.map((ip, j) => {
              if (ip.startsWith("$") && ip.endsWith("$") && ip.length > 2) {
                return <InlineMath key={j} math={ip.slice(1, -1)} />;
              }
              return <span key={j}>{ip}</span>;
            })}
          </span>
        );
      })}
    </>
  );
}
