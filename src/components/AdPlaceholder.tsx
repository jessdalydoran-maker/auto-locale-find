interface AdPlaceholderProps {
  slot: "header" | "mid-content" | "sidebar" | "footer";
}

export const AdPlaceholder = ({ slot }: AdPlaceholderProps) => {
  const sizes: Record<string, string> = {
    header: "h-20",
    "mid-content": "h-24",
    sidebar: "h-60",
    footer: "h-20",
  };

  return (
    <div
      className={`w-full ${sizes[slot]} bg-secondary/60 border border-border rounded-lg flex items-center justify-center my-2`}
    >
      <span className="text-[11px] text-muted-foreground/60">Ad Space — {slot}</span>
    </div>
  );
};
