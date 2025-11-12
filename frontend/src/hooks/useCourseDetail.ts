import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/api';
import { CourseWithSections } from '../types';

export function useCourseDetail(courseId: string) {
  const {
    data: course,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      const response = await apiClient.getCourseById(courseId);
      return response;
    },
    enabled: !!courseId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    course,
    isLoading,
    error,
    refetch,
  };
}

export default useCourseDetail;