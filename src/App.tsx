import {
  Box,
  Button,
  Card,
  CardBody,
  Checkbox,
  Collapse,
  Container,
  Divider,
  Flex,
  Heading,
  HStack,
  IconButton,
  Input,
  SlideFade,
  Stack,
  Tag,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  DeleteIcon,
  EditIcon,
  SmallCloseIcon,
} from "@chakra-ui/icons";
import { FormEvent, useEffect, useMemo, useState } from "react";

type TodoItem = {
  id: number;
  text: string;
  completed: boolean;
  createdAt: string;
};

type TodoList = {
  id: number;
  title: string;
  createdAt: string;
  todos: TodoItem[];
};

const STORAGE_KEY = "nirmala-multi-list-v1";

const isValidTodoItem = (todo: unknown): todo is TodoItem => {
  if (!todo || typeof todo !== "object") {
    return false;
  }

  const typedTodo = todo as Partial<TodoItem>;
  return (
    typeof typedTodo.id === "number" &&
    typeof typedTodo.text === "string" &&
    typeof typedTodo.completed === "boolean" &&
    typeof typedTodo.createdAt === "string"
  );
};

const readStoredLists = (): TodoList[] => {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);
    if (!rawValue) {
      return [];
    }

    const parsedValue = JSON.parse(rawValue) as unknown;
    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue
      .filter((list): list is TodoList => {
        if (!list || typeof list !== "object") {
          return false;
        }

        const typedList = list as Partial<TodoList>;
        return (
          typeof typedList.id === "number" &&
          typeof typedList.title === "string" &&
          typeof typedList.createdAt === "string" &&
          Array.isArray(typedList.todos) &&
          typedList.todos.every(isValidTodoItem)
        );
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch {
    return [];
  }
};

const formatDateLabel = (isoDate: string) => {
  const date = new Date(isoDate);
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
};

const App = () => {
  const [lists, setLists] = useState<TodoList[]>(() => readStoredLists());
  const [newListTitle, setNewListTitle] = useState("");
  const [draftTasks, setDraftTasks] = useState<Record<number, string>>({});
  const [expandedLists, setExpandedLists] = useState<Record<number, boolean>>(
    {},
  );
  const [editingTasks, setEditingTasks] = useState<Record<number, string>>({});

  const totalTasks = useMemo(
    () => lists.reduce((sum, list) => sum + list.todos.length, 0),
    [lists],
  );

  const totalCompleted = useMemo(
    () =>
      lists.reduce(
        (sum, list) => sum + list.todos.filter((todo) => todo.completed).length,
        0,
      ),
    [lists],
  );

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lists));
  }, [lists]);

  const handleCreateList = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedTitle = newListTitle.trim();

    if (!trimmedTitle) {
      return;
    }

    const newListId = Date.now();
    const createdAt = new Date().toISOString();

    setLists((previousLists) => [
      { id: newListId, title: trimmedTitle, createdAt, todos: [] },
      ...previousLists,
    ]);
    setExpandedLists((previousExpandedLists) => ({
      ...previousExpandedLists,
      [newListId]: true,
    }));
    setDraftTasks((previousDrafts) => ({ ...previousDrafts, [newListId]: "" }));
    setNewListTitle("");
  };

  const toggleList = (listId: number, isFirstList: boolean) => {
    if (isFirstList) {
      return;
    }

    setExpandedLists((previousExpandedLists) => ({
      ...previousExpandedLists,
      [listId]: !previousExpandedLists[listId],
    }));
  };

  const setDraftTask = (listId: number, value: string) => {
    setDraftTasks((previousDrafts) => ({ ...previousDrafts, [listId]: value }));
  };

  const addTaskToList = (listId: number) => {
    const rawText = draftTasks[listId] ?? "";
    const trimmedText = rawText.trim();

    if (!trimmedText) {
      return;
    }

    setLists((previousLists) =>
      previousLists.map((list) =>
        list.id === listId
          ? {
              ...list,
              todos: [
                ...list.todos,
                {
                  id: Date.now(),
                  text: trimmedText,
                  completed: false,
                  createdAt: new Date().toISOString(),
                },
              ],
            }
          : list,
      ),
    );
    setDraftTasks((previousDrafts) => ({ ...previousDrafts, [listId]: "" }));
  };

  const toggleTask = (listId: number, taskId: number) => {
    setLists((previousLists) =>
      previousLists.map((list) =>
        list.id === listId
          ? {
              ...list,
              todos: list.todos.map((todo) =>
                todo.id === taskId
                  ? { ...todo, completed: !todo.completed }
                  : todo,
              ),
            }
          : list,
      ),
    );
  };

  const deleteTask = (listId: number, taskId: number) => {
    setLists((previousLists) =>
      previousLists.map((list) =>
        list.id === listId
          ? {
              ...list,
              todos: list.todos.filter((todo) => todo.id !== taskId),
            }
          : list,
      ),
    );
    setEditingTasks((previousEditingTasks) => {
      const nextEditingTasks = { ...previousEditingTasks };
      delete nextEditingTasks[taskId];
      return nextEditingTasks;
    });
  };

  const startEditingTask = (taskId: number, currentText: string) => {
    setEditingTasks((previousEditingTasks) => ({
      ...previousEditingTasks,
      [taskId]: currentText,
    }));
  };

  const setEditingTaskValue = (taskId: number, value: string) => {
    setEditingTasks((previousEditingTasks) => ({
      ...previousEditingTasks,
      [taskId]: value,
    }));
  };

  const cancelEditingTask = (taskId: number) => {
    setEditingTasks((previousEditingTasks) => {
      const nextEditingTasks = { ...previousEditingTasks };
      delete nextEditingTasks[taskId];
      return nextEditingTasks;
    });
  };

  const saveTaskEdit = (listId: number, taskId: number) => {
    const rawText = editingTasks[taskId] ?? "";
    const trimmedText = rawText.trim();

    if (!trimmedText) {
      return;
    }

    setLists((previousLists) =>
      previousLists.map((list) =>
        list.id === listId
          ? {
              ...list,
              todos: list.todos.map((todo) =>
                todo.id === taskId ? { ...todo, text: trimmedText } : todo,
              ),
            }
          : list,
      ),
    );
    cancelEditingTask(taskId);
  };

  const moveTask = (listId: number, taskId: number, direction: -1 | 1) => {
    setLists((previousLists) =>
      previousLists.map((list) => {
        if (list.id !== listId) {
          return list;
        }

        const currentIndex = list.todos.findIndex((todo) => todo.id === taskId);
        const nextIndex = currentIndex + direction;

        if (
          currentIndex === -1 ||
          nextIndex < 0 ||
          nextIndex >= list.todos.length
        ) {
          return list;
        }

        const nextTodos = [...list.todos];
        const [movedTask] = nextTodos.splice(currentIndex, 1);
        nextTodos.splice(nextIndex, 0, movedTask);

        return {
          ...list,
          todos: nextTodos,
        };
      }),
    );
  };

  const deleteList = (listId: number) => {
    setLists((previousLists) =>
      previousLists.filter((list) => list.id !== listId),
    );
  };

  const cardBg = useColorModeValue("white", "gray.700");
  const sectionBg = useColorModeValue("gray.50", "gray.700");
  const sectionBorder = useColorModeValue("gray.200", "gray.600");
  const focusedSectionBg = useColorModeValue("teal.50", "teal.900");
  const focusedSectionBorder = useColorModeValue("teal.300", "teal.500");
  const taskBg = useColorModeValue("white", "gray.800");
  const taskBorder = useColorModeValue("gray.200", "gray.600");
  const taskText = useColorModeValue("gray.700", "gray.100");
  const mutedText = useColorModeValue("gray.500", "gray.400");

  return (
    <Box
      minH="100vh"
      py={{ base: 8, md: 16 }}
      bgGradient="linear(to-br, gray.900, gray.800)"
    >
      <Container maxW="2xl">
        <Card shadow="lg" bg={cardBg} borderRadius="2xl">
          <CardBody p={{ base: 4, sm: 5, md: 8 }}>
            <Stack spacing={6}>
              <Box>
                <Heading size={{ base: "md", md: "lg" }}>My To-Do Lists</Heading>
                <Text mt={2} color="gray.500">
                  Create multiple lists and keep old ones below.
                </Text>
              </Box>

              <form onSubmit={handleCreateList}>
                <Stack direction={{ base: "column", sm: "row" }} spacing={3}>
                  <Input
                    placeholder="Create new list (example: Monday Plan)"
                    value={newListTitle}
                    onChange={(event) => setNewListTitle(event.target.value)}
                    size="lg"
                  />
                  <Button
                    type="submit"
                    colorScheme="blue"
                    px={8}
                    w={{ base: "full", sm: "auto" }}
                  >
                    New List
                  </Button>
                </Stack>
              </form>

              <Flex justify="space-between" align="center" wrap="wrap" gap={2}>
                <Tag colorScheme="blue" px={3} py={1}>
                  {lists.length} lists
                </Tag>
                <Tag colorScheme="green" px={3} py={1}>
                  {totalCompleted} completed
                </Tag>
                <Tag colorScheme="purple" px={3} py={1}>
                  {totalTasks} tasks
                </Tag>
              </Flex>

              <Divider />

              <Stack spacing={3}>
                {lists.length === 0 ? (
                  <Text color="gray.500">
                    No lists yet. Create your first list above.
                  </Text>
                ) : (
                  lists.map((list, index) => {
                    const isFocusedList = index === 0;
                    const isOpen =
                      isFocusedList || Boolean(expandedLists[list.id]);

                    return (
                      <SlideFade
                        key={list.id}
                        in={true}
                        offsetY={12}
                        transition={{ enter: { duration: 0.2 + index * 0.05 } }}
                      >
                        <Box
                          borderWidth="1px"
                          borderRadius="xl"
                          p={4}
                          bg={isFocusedList ? focusedSectionBg : sectionBg}
                          borderColor={
                            isFocusedList ? focusedSectionBorder : sectionBorder
                          }
                          boxShadow={isFocusedList ? "md" : "sm"}
                          transition="all 0.25s ease"
                        >
                          <Stack
                            spacing={2}
                            mb={3}
                            cursor={isFocusedList ? "default" : "pointer"}
                            onClick={() => toggleList(list.id, isFocusedList)}
                          >
                            <Flex justify="space-between" align="center" gap={2}>
                              <HStack spacing={2} minW={0}>
                                {!isFocusedList &&
                                  (isOpen ? (
                                    <ChevronDownIcon />
                                  ) : (
                                    <ChevronRightIcon />
                                  ))}
                                <Heading size="sm" noOfLines={1}>
                                  {list.title}
                                </Heading>
                              </HStack>
                              <IconButton
                                aria-label="Delete list"
                                icon={<DeleteIcon />}
                                variant="ghost"
                                colorScheme="red"
                                size="sm"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  deleteList(list.id);
                                }}
                              />
                            </Flex>

                            <Flex gap={2} wrap="wrap">
                              <Tag size="sm" colorScheme="gray">
                                {formatDateLabel(list.createdAt)}
                              </Tag>
                              <Tag
                                size="sm"
                                colorScheme={isFocusedList ? "teal" : "gray"}
                              >
                                {list.todos.length} tasks
                              </Tag>
                            </Flex>
                          </Stack>

                          <Collapse in={isOpen} animateOpacity>
                            <Stack spacing={3}>
                              <Stack
                                direction={{ base: "column", sm: "row" }}
                                spacing={2}
                              >
                                <Input
                                  placeholder="Add a task to this list..."
                                  value={draftTasks[list.id] ?? ""}
                                  onChange={(event) =>
                                    setDraftTask(list.id, event.target.value)
                                  }
                                  onKeyDown={(event) => {
                                    if (event.key === "Enter") {
                                      event.preventDefault();
                                      addTaskToList(list.id);
                                    }
                                  }}
                                />
                                <Button
                                  colorScheme="blue"
                                  onClick={() => addTaskToList(list.id)}
                                  w={{ base: "full", sm: "auto" }}
                                >
                                  Add
                                </Button>
                              </Stack>

                              {list.todos.length === 0 ? (
                                <Text color={mutedText} fontSize="sm">
                                  No tasks yet in this list.
                                </Text>
                              ) : (
                                <Stack spacing={2}>
                                  {list.todos.map((todo, todoIndex) => {
                                    const isEditing =
                                      editingTasks[todo.id] !== undefined;

                                    return (
                                    <Flex
                                      key={todo.id}
                                      borderWidth="1px"
                                      borderColor={taskBorder}
                                      borderRadius="lg"
                                      p={3}
                                      align="center"
                                      justify="space-between"
                                      bg={taskBg}
                                      gap={2}
                                    >
                                      <Box flex="1">
                                        {isEditing ? (
                                          <Input
                                            value={editingTasks[todo.id] ?? ""}
                                            onChange={(event) =>
                                              setEditingTaskValue(
                                                todo.id,
                                                event.target.value,
                                              )
                                            }
                                            onKeyDown={(event) => {
                                              if (event.key === "Enter") {
                                                event.preventDefault();
                                                saveTaskEdit(list.id, todo.id);
                                              }

                                              if (event.key === "Escape") {
                                                event.preventDefault();
                                                cancelEditingTask(todo.id);
                                              }
                                            }}
                                            autoFocus
                                          />
                                        ) : (
                                          <Checkbox
                                            isChecked={todo.completed}
                                            onChange={() =>
                                              toggleTask(list.id, todo.id)
                                            }
                                            colorScheme="green"
                                          >
                                            <Text
                                              as={todo.completed ? "s" : "span"}
                                              color={
                                                todo.completed
                                                  ? mutedText
                                                  : taskText
                                              }
                                            >
                                              {todo.text}
                                            </Text>
                                          </Checkbox>
                                        )}
                                      </Box>

                                      <HStack spacing={1} align="center">
                                        <IconButton
                                          aria-label="Move task up"
                                          icon={<ArrowUpIcon />}
                                          variant="ghost"
                                          size="sm"
                                          isDisabled={todoIndex === 0}
                                          onClick={() =>
                                            moveTask(list.id, todo.id, -1)
                                          }
                                        />
                                        <IconButton
                                          aria-label="Move task down"
                                          icon={<ArrowDownIcon />}
                                          variant="ghost"
                                          size="sm"
                                          isDisabled={
                                            todoIndex === list.todos.length - 1
                                          }
                                          onClick={() =>
                                            moveTask(list.id, todo.id, 1)
                                          }
                                        />
                                        {isEditing ? (
                                          <>
                                            <IconButton
                                              aria-label="Save task"
                                              icon={<CheckIcon />}
                                              variant="ghost"
                                              colorScheme="green"
                                              size="sm"
                                              onClick={() =>
                                                saveTaskEdit(list.id, todo.id)
                                              }
                                            />
                                            <IconButton
                                              aria-label="Cancel edit"
                                              icon={<SmallCloseIcon />}
                                              variant="ghost"
                                              size="sm"
                                              onClick={() =>
                                                cancelEditingTask(todo.id)
                                              }
                                            />
                                          </>
                                        ) : (
                                          <IconButton
                                            aria-label="Edit task"
                                            icon={<EditIcon />}
                                            variant="ghost"
                                            colorScheme="blue"
                                            size="sm"
                                            onClick={() =>
                                              startEditingTask(
                                                todo.id,
                                                todo.text,
                                              )
                                            }
                                          />
                                        )}
                                        <IconButton
                                          aria-label="Delete task"
                                          icon={<DeleteIcon />}
                                          variant="ghost"
                                          colorScheme="red"
                                          size="sm"
                                          onClick={() =>
                                            deleteTask(list.id, todo.id)
                                          }
                                        />
                                      </HStack>
                                    </Flex>
                                    );
                                  })}
                                </Stack>
                              )}
                            </Stack>
                          </Collapse>

                          {!isOpen && (
                            <Text fontSize="sm" color={mutedText}>
                              Hidden. Tap to expand this list.
                            </Text>
                          )}
                        </Box>
                      </SlideFade>
                    );
                  })
                )}
              </Stack>
            </Stack>
          </CardBody>
        </Card>
      </Container>
    </Box>
  );
};

export default App;
