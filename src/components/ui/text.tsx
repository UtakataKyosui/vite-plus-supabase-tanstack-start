import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import type { ComponentProps } from "react";

const textVariants = cva("", {
  variants: {
    size: {
      sm: "text-sm leading-6",
      default: "text-base leading-7",
      lg: "text-lg leading-8",
    },
    tone: {
      default: "text-foreground",
      muted: "text-muted-foreground",
      destructive: "text-destructive",
    },
  },
  defaultVariants: {
    size: "default",
    tone: "default",
  },
});

type TextProps = ComponentProps<"p"> &
  VariantProps<typeof textVariants> & {
    as?: "p" | "span" | "div" | "small";
  };

function Text({ as: Tag = "p", size, tone, className, ...props }: TextProps) {
  return (
    <Tag data-slot="text" className={cn(textVariants({ size, tone }), className)} {...props} />
  );
}

export { Text, textVariants };
