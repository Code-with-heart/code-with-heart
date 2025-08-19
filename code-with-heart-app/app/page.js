import { createClient } from "@/utils/supabase/server";

export default async function Page() {
  const supabase = await createClient();
  const { data: todos, error } = await supabase.from("todos").select();

  if (error) {
    console.error("Error fetching todos:", error.message);
    return <p>Fehler beim Laden der Todos.</p>;
  }

  return (
    <>
      <h1>Meine Todos</h1>
      <ul>
        {todos?.map((todo) => (
          <li key={todo.id}>{todo.task}</li>
        ))}
      </ul>
    </>
  );
}
