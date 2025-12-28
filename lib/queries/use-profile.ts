"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getProfile, createOrUpdateProfile } from "@/lib/actions/profile";
import type { UserProfileData } from "@/lib/types/profile";
import type { ProfileFormValues } from "@/lib/validations/profile-schema";

/**
 * Hook pour récupérer le profil utilisateur
 */
export function useProfile() {
  return useQuery<UserProfileData | null>({
    queryKey: ["profile"],
    queryFn: () => getProfile(),
  });
}

/**
 * Hook pour créer ou mettre à jour le profil
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ProfileFormValues) => createOrUpdateProfile(data),
    onMutate: async (newProfile) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["profile"] });

      // Snapshot previous value
      const previousProfile = queryClient.getQueryData(["profile"]);

      // Optimistically update
      queryClient.setQueryData(["profile"], newProfile);

      return { previousProfile };
    },
    onError: (_err, _newProfile, context) => {
      // Rollback on error
      if (context?.previousProfile) {
        queryClient.setQueryData(["profile"], context.previousProfile);
      }
    },
    onSettled: () => {
      // Refetch to sync with server
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}
