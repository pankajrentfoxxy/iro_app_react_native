import { router } from 'expo-router';

/** Path typing from generated routes can lag new files; keep navigation typed loosely here. */
export const nav = {
  replace: (href: string) => router.replace(href as never),
  push: (href: string) => router.push(href as never),
  pushParams: (href: string, params: Record<string, string>) =>
    router.push({ pathname: href as never, params } as never),
  replaceParams: (href: string, params: Record<string, string>) =>
    router.replace({ pathname: href as never, params } as never),
  back: () => router.back(),
};
