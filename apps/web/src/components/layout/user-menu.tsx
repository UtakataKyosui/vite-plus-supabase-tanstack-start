import { Link } from "@tanstack/react-router";
import { LogOut, Settings, User } from "lucide-react";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

export function UserMenu({ email }: { email: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="rounded-full" />}>
        <Avatar size="sm">
          <AvatarFallback>{email.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <span className="sr-only">User menu</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuLabel className="truncate">{email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link to="/profile" />}>
          <User />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link to="/group" />}>
          <Settings />
          Group Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link to="/logout" />}>
          <LogOut />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
