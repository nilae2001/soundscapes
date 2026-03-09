import {
  ActionIcon,
  useMantineColorScheme,
  useComputedColorScheme,
} from "@mantine/core";
import { IconSun, IconMoon } from "@tabler/icons-react";

export function ThemeToggle() {
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme("light", {
    getInitialValueInEffect: true,
  });

  return (
    <ActionIcon
      onClick={() =>
        setColorScheme(computedColorScheme === "light" ? "dark" : "light")
      }
      variant="default"
      size="lg"
      aria-label="Toggle color scheme"
      className="border-border bg-surface hover:bg-surface/80"
    >
      {computedColorScheme === "light" ? (
        <IconMoon size={20} stroke={1.5} className="text-text-primary" />
      ) : (
        <IconSun size={20} stroke={1.5} className="text-accent" />
      )}
    </ActionIcon>
  );
}
