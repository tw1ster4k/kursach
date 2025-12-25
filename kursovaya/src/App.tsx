import React, { useEffect, useState } from "react";

// ---------- Types ----------
type Student = {
  id: number;
  name: string;
};

type Group = {
  id: number;
  name: string;
  students: Student[];
};

type Discipline = {
  id: number;
  name: string;
  control: "зачет" | "экзамен";
};

type Message = {
  text: string;
  type: "success" | "error";
};

// ---------- Sorting Tree ----------
class TreeNode {
  value: Student;
  left: TreeNode | null = null;
  right: TreeNode | null = null;

  constructor(value: Student) {
    this.value = value;
  }
}

class SortingTree {
  root: TreeNode | null = null;

  insert(student: Student) {
    const node = new TreeNode(student);

    if (!this.root) {
      this.root = node;
      return;
    }

    let current = this.root;
    while (true) {
      if (student.name.localeCompare(current.value.name) < 0) {
        if (!current.left) {
          current.left = node;
          break;
        }
        current = current.left;
      } else {
        if (!current.right) {
          current.right = node;
          break;
        }
        current = current.right;
      }
    }
  }

  traverse(): Student[] {
    const result: Student[] = [];

    const inorder = (node: TreeNode | null) => {
      if (!node) return;
      inorder(node.left);
      result.push(node.value);
      inorder(node.right);
    };

    inorder(this.root);
    return result;
  }
}

// ---------- App ----------
export default function App() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [message, setMessage] = useState<Message | null>(null);

  // ---------- Helpers ----------
  const showMessage = (text: string, type: "success" | "error" = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const generateSortedStudents = (students: Student[]) => {
    const tree = new SortingTree();
    students.forEach((s) => tree.insert(s));
    return tree.traverse();
  };

  // ---------- Load from TXT (ONCE) ----------
  useEffect(() => {
    fetch("/data.txt")
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.text();
      })
      .then(initFromTxt)
      .catch(() =>
        showMessage("Ошибка загрузки data.txt", "error")
      );
  }, []);

  const initFromTxt = (text: string) => {
    try {
      let mode: "groups" | "disciplines" | null = null;
      const parsedGroups: Group[] = [];
      const parsedDisciplines: Discipline[] = [];

      text
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .forEach((line) => {
          if (line === "[GROUPS]") {
            mode = "groups";
            return;
          }
          if (line === "[DISCIPLINES]") {
            mode = "disciplines";
            return;
          }

          if (mode === "groups") {
            const [groupName, studentsRaw] = line.split("|");
            if (!groupName) return;

            parsedGroups.push({
              id: Date.now() + Math.random(),
              name: groupName,
              students: studentsRaw
                ? studentsRaw.split(",").map((s) => ({
                    id: Date.now() + Math.random(),
                    name: s.trim()
                  }))
                : []
            });
          }

          if (mode === "disciplines") {
            const [name, control] = line.split("|");
            if (control !== "зачет" && control !== "экзамен") return;

            parsedDisciplines.push({
              id: Date.now() + Math.random(),
              name,
              control
            });
          }
        });

      setGroups(parsedGroups);
      setDisciplines(parsedDisciplines);
      showMessage("Данные загружены из файла");
    } catch {
      showMessage("Некорректный формат data.txt", "error");
    }
  };

  // ---------- Groups CRUD ----------
  const addGroup = () => {
    const name = prompt("Название новой группы:");
    if (!name || !name.trim()) {
      showMessage("Название группы не может быть пустым", "error");
      return;
    }

    if (groups.some((g) => g.name.toLowerCase() === name.toLowerCase())) {
      showMessage("Такая группа уже существует", "error");
      return;
    }

    setGroups([...groups, { id: Date.now(), name, students: [] }]);
    showMessage("Группа добавлена");
  };

  const removeGroup = (id: number) => {
    setGroups(groups.filter((g) => g.id !== id));
    if (selectedGroup?.id === id) setSelectedGroup(null);
    showMessage("Группа удалена");
  };

  // ---------- Students CRUD ----------
  const addStudent = () => {
    if (!selectedGroup) return;

    const name = prompt("ФИО студента:");
    if (!name || !name.trim()) {
      showMessage("ФИО не может быть пустым", "error");
      return;
    }

    if (
      selectedGroup.students.some(
        (s) => s.name.toLowerCase() === name.toLowerCase()
      )
    ) {
      showMessage("Такой студент уже есть", "error");
      return;
    }

    const updatedGroups = groups.map((g) =>
      g.id === selectedGroup.id
        ? {
            ...g,
            students: [...g.students, { id: Date.now(), name }]
          }
        : g
    );

    setGroups(updatedGroups);
    setSelectedGroup(
      updatedGroups.find((g) => g.id === selectedGroup.id) || null
    );

    showMessage("Студент добавлен");
  };

  const removeStudent = (id: number) => {
    if (!selectedGroup) return;

    const updatedGroups = groups.map((g) =>
      g.id === selectedGroup.id
        ? { ...g, students: g.students.filter((s) => s.id !== id) }
        : g
    );

    setGroups(updatedGroups);
    setSelectedGroup(
      updatedGroups.find((g) => g.id === selectedGroup.id) || null
    );

    showMessage("Студент удален");
  };

  // ---------- Disciplines CRUD ----------
  const addDiscipline = () => {
    const name = prompt("Название дисциплины:");
    if (!name || !name.trim()) {
      showMessage("Название не может быть пустым", "error");
      return;
    }

    if (
      disciplines.some(
        (d) => d.name.toLowerCase() === name.toLowerCase()
      )
    ) {
      showMessage("Такая дисциплина уже существует", "error");
      return;
    }

    const control = prompt("Форма контроля (зачет/экзамен):", "экзамен");
    if (control !== "зачет" && control !== "экзамен") {
      showMessage("Некорректная форма контроля", "error");
      return;
    }

    setDisciplines([
      ...disciplines,
      { id: Date.now(), name, control }
    ]);

    showMessage("Дисциплина добавлена");
  };

  const removeDiscipline = (id: number) => {
    setDisciplines(disciplines.filter((d) => d.id !== id));
    showMessage("Дисциплина удалена");
  };

  // ---------- UI ----------
  return (
    <div className="p-6 font-sans space-y-4">
      <h1 className="text-3xl font-bold">
        Деканат — генератор ведомостей
      </h1>

      {message && (
        <div
          className={`p-2 rounded ${
            message.type === "success"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Groups */}
      <div className="border p-4 rounded">
        <h2 className="text-xl font-semibold mb-2">Группы</h2>

        <button className="border px-2 py-1 mb-2" onClick={addGroup}>
          Добавить группу
        </button>

        <ul className="space-y-1">
          {groups.map((g) => (
            <li key={g.id}>
              <button
                className="underline mr-2"
                onClick={() => setSelectedGroup(g)}
              >
                {g.name}
              </button>
              <button
                className="text-red-600"
                onClick={() => removeGroup(g.id)}
              >
                удалить
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Disciplines */}
      <div className="border p-4 rounded">
        <h2 className="text-xl font-semibold mb-2">Дисциплины</h2>

        <button className="border px-2 py-1 mb-2" onClick={addDiscipline}>
          Добавить дисциплину
        </button>

        <ul className="space-y-1">
          {disciplines.map((d) => (
            <li key={d.id}>
              {d.name} — {d.control}
              <button
                className="ml-2 text-red-600"
                onClick={() => removeDiscipline(d.id)}
              >
                удалить
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Students */}
      {selectedGroup && (
        <div className="border p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">
            {selectedGroup.name}
          </h2>

          <button className="border px-2 py-1 mb-4" onClick={addStudent}>
            Добавить студента
          </button>

          {disciplines.map((disc) => (
            <div key={disc.id} className="border p-4 rounded mb-4">
              <h3 className="text-lg font-semibold">
                {disc.name} — <i>{disc.control}</i>
              </h3>

              <table className="w-full mt-2 border-collapse">
                <thead>
                  <tr>
                    <th className="border p-2">№</th>
                    <th className="border p-2">Студент</th>
                    <th className="border p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {generateSortedStudents(
                    selectedGroup.students
                  ).map((s, i) => (
                    <tr key={s.id}>
                      <td className="border p-2 text-center">
                        {i + 1}
                      </td>
                      <td className="border p-2">{s.name}</td>
                      <td className="border p-2 text-center">
                        <button
                          className="text-red-600"
                          onClick={() =>
                            removeStudent(s.id)
                          }
                        >
                          удалить
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
