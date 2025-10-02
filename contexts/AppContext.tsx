import createContextHook from "@nkzw/create-context-hook";
import { useCallback, useEffect, useMemo, useState } from "react";
import { articles } from "@/mocks/articles";
import { Player, Coach } from '@/services/profileApi';
type Theme = "light" | "dark";

export const [AppProvider, useApp] = createContextHook(() => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [players, setPlayers] = useState<Array<Player>>([]);
  const [coach, setCoach] = useState<Coach>();

  const filteredArticles = useMemo(() => {
    if (selectedCategory === "all") return articles;
    return articles.filter((article) => article.category === selectedCategory);
  }, [selectedCategory]);

  const featuredArticles = useMemo(() => {
    return articles.slice(0, 3);
  }, []);

  const latestArticles = useMemo(() => {
    return articles.slice(0, 6);
  }, []);


  return useMemo(
    () => ({
      articles,
      selectedCategory,
      setSelectedCategory,
      filteredArticles,
      featuredArticles,
      latestArticles,
      players,
      setPlayers,
      coach,
      setCoach
    }),
    [
      articles,
      selectedCategory,
      setSelectedCategory,
      filteredArticles,
      featuredArticles,
      latestArticles,
      players,
      coach
    ]
  );
});
