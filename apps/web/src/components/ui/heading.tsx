import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import type { ComponentProps } from "react";

const headingVariants = cva("font-heading font-semibold tracking-tight text-foreground", {
  variants: {
    size: {
      1: "text-4xl leading-tight",
      2: "text-3xl leading-tight",
      3: "text-2xl leading-snug",
      4: "text-xl leading-snug",
      5: "text-lg leading-snug",
      6: "text-base leading-snug",
    },
  },
  defaultVariants: {
    size: 2,
  },
});

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

type HeadingProps = Omit<ComponentProps<"h1">, "size"> &
  Omit<VariantProps<typeof headingVariants>, "size"> & {
    level?: HeadingLevel;
    size?: HeadingLevel;
  };

function Heading({ level = 2, size, className, ...props }: HeadingProps) {
  const Tag = `h${level}` as const;

  return (
    <Tag
      data-slot="heading"
      className={cn(headingVariants({ size: size ?? level }), className)}
      {...props}
    />
  );
}

export { Heading, headingVariants };
