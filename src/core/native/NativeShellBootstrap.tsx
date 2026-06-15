"use client";

import { useEffect } from "react";
import { bootNativeShell } from "./nativeShellBoot";

export default function NativeShellBootstrap() {
  useEffect(() => {
    bootNativeShell();
  }, []);
  return null;
}
