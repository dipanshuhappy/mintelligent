"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Coins, Home, Menu, User, X, Zap } from "lucide-react";
import { hardhat } from "viem/chains";
import { FaucetButton } from "~~/components/scaffold-eth";
import { useTargetNetwork } from "~~/hooks/scaffold-eth";

type HeaderMenuLink = {
  label: string;
  href: string;
  icon?: React.ReactNode;
};

export const menuLinks: HeaderMenuLink[] = [
  {
    label: "Home",
    href: "/",
    icon: <Home className="h-4 w-4" />,
  },
  {
    label: "Mint",
    href: "/mint",
    icon: <Coins className="h-4 w-4" />,
  },
  {
    label: "Profile",
    href: "/me",
    icon: <User className="h-4 w-4" />,
  },
];

export const HeaderMenuLinks = ({ mobile = false, onLinkClick }: { mobile?: boolean; onLinkClick?: () => void }) => {
  const pathname = usePathname();

  return (
    <>
      {menuLinks.map(({ label, href, icon }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            onClick={onLinkClick}
            className={`
              ${mobile ? "flex items-center gap-3 px-4 py-3 text-base font-medium rounded-xl transition-all duration-200 w-full" : "inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors"}
              ${
                isActive
                  ? mobile
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "bg-primary text-primary-foreground shadow-sm"
                  : mobile
                    ? "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }
            `}
          >
            {icon}
            <span>{label}</span>
          </Link>
        );
      })}
    </>
  );
};

/**
 * Site header
 */
export const Header = () => {
  const { targetNetwork } = useTargetNetwork();
  const isLocalNetwork = targetNetwork.id === hardhat.id;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo and Desktop Navigation */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Zap className="h-4 w-4" />
            </div>
            <span className="text-xl font-bold">Mintelligent</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <HeaderMenuLinks />
          </nav>
        </div>

        {/* Right Side - Connect Button and Mobile Menu */}
        <div className="flex items-center gap-4">
          {/* Local Network Badge */}
          {isLocalNetwork && (
            <Badge variant="secondary" className="hidden sm:flex">
              Local Network
            </Badge>
          )}

          {/* Connect Button */}
          <div className="hidden sm:block">
            <ConnectButton />
          </div>

          {/* Faucet Button for Local Network */}
          {isLocalNetwork && <FaucetButton />}

          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px] p-0">
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center gap-3 p-6 border-b">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <Zap className="h-5 w-5" />
                  </div>
                  <span className="text-xl font-bold">Mintelligent</span>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4">
                  <div className="space-y-2">
                    <HeaderMenuLinks mobile={true} onLinkClick={() => setMobileMenuOpen(false)} />
                  </div>
                </nav>

                {/* Bottom Section */}
                <div className="border-t p-4 space-y-4">
                  <div className="w-full">
                    <ConnectButton />
                  </div>

                  {isLocalNetwork && (
                    <div className="flex items-center justify-center">
                      <Badge variant="secondary" className="text-xs">
                        Local Network
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};
