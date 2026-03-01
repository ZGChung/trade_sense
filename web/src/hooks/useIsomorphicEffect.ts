import { useEffect, useLayoutEffect } from "react";

// SSR-safe useEffect
export const useIsomorphicEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;
