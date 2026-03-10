interface AdPlaceholderProps {
  slot: "header" | "mid-content" | "sidebar" | "footer";
}

export const AdPlaceholder = ({ slot }: AdPlaceholderProps) => {
  const sizes: Record<string, string> = {
    header: "h-24",
    "mid-content": "h-28",
    sidebar: "h-64",
    footer: "h-24",
  };

  return (
    <div
      className={`w-full ${sizes[slot]} bg-muted border border-border rounded-lg flex items-center justify-center`}
    >
      <span className="text-xs text-muted-foreground">Ad Space — {slot}</span>
    </div>
  );
};
