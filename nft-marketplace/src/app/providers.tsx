"use client";

import { ReactNode, useState } from "react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { Toaster } from "react-hot-toast";
import { config } from "@/config/wagmi";

import "@rainbow-me/rainbowkit/styles.css";

const customDarkTheme = darkTheme({
  accentColor: "#8B5CF6",
  accentColorForeground: "white",
  borderRadius: "large",
  fontStack: "system",
  overlayBlur: "small",
});

Object.assign(customDarkTheme.colors, {
  actionButtonBorder: "#1E1E2E",
  actionButtonBorderMobile: "#1E1E2E",
  closeButton: "#6B7280",
  closeButtonBackground: "#1A1A2E",
  connectButtonBackground: "#13131A",
  connectButtonInnerBackground: "#13131A",
  connectButtonText: "#F9FAFB",
  connectionIndicator: "#10B981",
  downloadBottomCardBackground: "#13131A",
  downloadTopCardBackground: "#1A1A2E",
  error: "#EF4444",
  generalBorder: "#1E1E2E",
  generalBorderDim: "#1E1E2E",
  menuItemBackground: "#1A1A2E",
  modalBackground: "#0A0A0F",
  modalBorder: "#1E1E2E",
  modalText: "#F9FAFB",
  modalTextDim: "#9CA3AF",
  modalTextSecondary: "#6B7280",
  profileAction: "#1A1A2E",
  profileActionHover: "#13131A",
  profileForeground: "#13131A",
  selectedOptionBorder: "#8B5CF6",
  standby: "#F59E0B",
});

Object.assign(customDarkTheme.radii, {
  actionButton: "12px",
  connectButton: "50px",
  menuButton: "12px",
  modal: "24px",
  modalMobile: "24px",
});

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={customDarkTheme} locale="en-US">
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "#13131A",
                color: "#F9FAFB",
                border: "1px solid #1E1E2E",
                borderRadius: "12px",
              },
              success: {
                iconTheme: { primary: "#10B981", secondary: "#F9FAFB" },
              },
              error: {
                iconTheme: { primary: "#EF4444", secondary: "#F9FAFB" },
              },
            }}
          />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
