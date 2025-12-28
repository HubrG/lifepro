import { useQuery } from "@tanstack/react-query";
import { getDailySummary, getDailySummaries } from "@/lib/actions/daily-summary";

/**
 * Hook pour récupérer le résumé quotidien d'une date
 */
export function useDailySummary(date: Date = new Date()) {
  return useQuery({
    queryKey: ["daily-summary", date.toISOString()],
    queryFn: async () => {
      const result = await getDailySummary(date);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Hook pour récupérer les résumés quotidiens sur une période
 */
export function useDailySummaries(days: number = 7) {
  return useQuery({
    queryKey: ["daily-summaries", days],
    queryFn: async () => {
      const result = await getDailySummaries(days);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data || [];
    },
    staleTime: 60 * 1000, // 1 minute
  });
}
