"use client";

import * as React from "react";
import { Home, User, Settings, Search, LogOut, FileText, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { UserAvatar } from "@/components/user-avatar";

const menuItems = [
  {
    title: "Home",
    url: "/",
    icon: Home,
  },
  {
    title: "Search",
    url: "/search",
    icon: Search,
  },
  {
    title: "Profile",
    url: "/profile",
    icon: User,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
];

function AppSidebar({ user, onSignOut }) {
  const pathname = usePathname();
  const fullName = user?.full_name || "";
  const [profilePictureUrl, setProfilePictureUrl] = React.useState(null);

  React.useEffect(() => {
    const fetchLinkedInPicture = async () => {
      if (!user?.id) return;
      try {
        const res = await fetch("/api/linkedin/status");
        if (!res.ok) return;
        const json = await res.json();
        if (json.connected && json.account?.picture) {
          setProfilePictureUrl(json.account.picture);
        }
      } catch (e) {
        // silently ignore
      }
    };
    fetchLinkedInPicture();
  }, [user?.id]);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center justify-between gap-2">
          <SidebarMenu className="flex-1 group-data-[collapsible=icon]:hidden">
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <Link href="/">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <Home className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">Code with Heart</span>
                    <span className="truncate text-xs">HTWG Community</span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <SidebarTrigger />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    tooltip={item.title}
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarGroup>
          <SidebarGroupLabel>Legal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/tos"} tooltip="Terms of Service">
                  <Link href="/tos">
                    <FileText />
                    <span>Terms of Service</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/privacy"} tooltip="Data Privacy">
                  <Link href="/privacy">
                    <ShieldCheck />
                    <span>Data Privacy</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarMenu>
          {user ? (
            <>
              <SidebarMenuItem>
                <SidebarMenuButton size="lg" asChild>
                  <div className="flex items-center gap-2">
                    <UserAvatar fullName={fullName} profilePictureUrl={profilePictureUrl} />
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {fullName || "Account"}
                      </span>
                      <span className="truncate text-xs">{user.email || user.authEmail || ""}</span>
                    </div>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  size="md"
                  onClick={onSignOut}
                  tooltip="Sign out"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground justify-center"
                >
                  <LogOut className="size-4" />
                  <span>Sign out</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </>
          ) : (
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <Link href="/login">
                  <UserAvatar />
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">Sign in</span>
                    <span className="truncate text-xs">Access your account</span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background">
      <div className="flex items-center justify-around h-16">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.url;
          return (
            <Link
              key={item.url}
              href={item.url}
              className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? "fill-current" : ""}`} />
              <span className="text-xs font-medium">{item.title}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function AppHeader({ children }) {
  const { user, signOut } = useAuth();

  return (
    <SidebarProvider>
      <div className="hidden md:block">
        <AppSidebar user={user} onSignOut={signOut} />
      </div>
      <SidebarInset>
        <main className="flex flex-1 flex-col pb-16 md:pb-0">
          {children}
        </main>
        <BottomNav />
      </SidebarInset>
    </SidebarProvider>
  );
}
