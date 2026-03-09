import { useTranslations as useNextIntlTranslations } from 'next-intl';

export function useClientTranslations(namespace?: string) {
  return useNextIntlTranslations(namespace);
}
