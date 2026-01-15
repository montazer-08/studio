'use client';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useUser } from "@/firebase";
import { getAuth, signOut } from "firebase/auth";
import { ChevronDown, LogIn, LogOut, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "../ui/skeleton";
import { useLocalization } from "./localization-provider";

export function UserProfile() {
    const { user, isUserLoading } = useUser();
    const { t } = useLocalization();
    const auth = getAuth();

    const handleLogout = () => {
        signOut(auth);
    }

    if (isUserLoading) {
        return (
            <div className="flex items-center gap-3 p-4">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-20" />
                </div>
            </div>
        )
    }

    if (!user) {
        return (
            <div className="p-4">
                <Button asChild className="w-full">
                    <Link href="/login"><LogIn className="me-2 h-4 w-4"/>{t.userProfile.login}</Link>
                </Button>
            </div>
        )
    }

  return (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary text-primary-foreground font-headline">
                    {user.email ? user.email[0].toUpperCase() : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <span className="font-headline text-base font-bold truncate">{user.email}</span>
                <p className="text-xs text-muted-foreground">{t.userProfile.workspace}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>{t.userProfile.myAccount}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
                <Link href="/settings">
                    <UserIcon className="me-2 h-4 w-4" />
                    <span>{t.userProfile.profileSettings}</span>
                </Link>
            </DropdownMenuItem>
             <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="me-2 h-4 w-4" />
                <span>{t.userProfile.logout}</span>
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
  );
}
