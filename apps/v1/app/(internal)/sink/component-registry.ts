import { AvatarDemo } from "./components/avatar-demo";

type ComponentConfig = {
  name: string;
  component: React.ComponentType;
  className?: string;
  type: "registry:ui" | "registry:page" | "registry:block";
  href: string;
  label?: string;
}

export const componentRegistry: Record<string, ComponentConfig> = {
  avatar: {
    name: "Avatar",
    component: AvatarDemo,
    type: "registry:ui",
    href: "/sink/avatar"
  }
}
