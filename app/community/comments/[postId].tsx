import { useLocalSearchParams, Redirect } from 'expo-router';

export default function CommentsRedirect() {
  const { postId } = useLocalSearchParams<{ postId: string }>();
  return <Redirect href={`/community/post/${postId}`} />;
}
