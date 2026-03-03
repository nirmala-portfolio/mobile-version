import {
  Box,
  Button,
  Card,
  CardBody,
  Checkbox,
  Container,
  Divider,
  Flex,
  Heading,
  HStack,
  IconButton,
  Input,
  Stack,
  Tag,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { DeleteIcon } from "@chakra-ui/icons";
import { FormEvent, useMemo, useState } from "react";

type Todo = {
  id: number;
  text: string;
  completed: boolean;
};

const App = () => {
  const [input, setInput] = useState("");
  const [todos, setTodos] = useState<Todo[]>([]);

  const completedCount = useMemo(
    () => todos.filter((todo) => todo.completed).length,
    [todos],
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!input.trim()) {
      return;
    }

    setTodos((previousTodos) => [
      ...previousTodos,
      {
        id: Date.now(),
        text: input.trim(),
        completed: false,
      },
    ]);
    setInput("");
  };

  const toggleTodo = (id: number) => {
    setTodos((previousTodos) =>
      previousTodos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo,
      ),
    );
  };

  const deleteTodo = (id: number) => {
    setTodos((previousTodos) => previousTodos.filter((todo) => todo.id !== id));
  };

  const cardBg = useColorModeValue("white", "gray.700");

  return (
    <Box minH="100vh" py={16} bgGradient="linear(to-br, gray.900, gray.800)">
      <Container maxW="2xl">
        <Card shadow="lg" bg={cardBg} borderRadius="2xl">
          <CardBody p={8}>
            <Stack spacing={6}>
              <Box>
                <Heading size="lg">My To-Do List</Heading>
                <Text mt={2} color="gray.500">
                  Hey Nemo.. Lets Write your day .. !!!
                </Text>
              </Box>

              <form onSubmit={handleSubmit}>
                <HStack spacing={3} align="stretch">
                  <Input
                    placeholder="Add a task..."
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    size="lg"
                  />
                  <Button type="submit" colorScheme="blue" px={8}>
                    Add
                  </Button>
                </HStack>
              </form>

              <Flex justify="space-between" align="center">
                <Tag colorScheme="blue" px={3} py={1}>
                  {todos.length} total
                </Tag>
                <Tag colorScheme="green" px={3} py={1}>
                  {completedCount} completed
                </Tag>
              </Flex>

              <Divider />

              <Stack spacing={3}>
                {todos.length === 0 ? (
                  <Text color="gray.500">
                    No tasks yet. Add your first to-do above.
                  </Text>
                ) : (
                  todos.map((todo) => (
                    <Flex
                      key={todo.id}
                      borderWidth="1px"
                      borderColor="gray.100"
                      borderRadius="xl"
                      p={3}
                      align="center"
                      justify="space-between"
                    >
                      <Checkbox
                        isChecked={todo.completed}
                        onChange={() => toggleTodo(todo.id)}
                        colorScheme="green"
                        flex="1"
                      >
                        <Text as={todo.completed ? "s" : "span"}>
                          {todo.text}
                        </Text>
                      </Checkbox>
                      <IconButton
                        aria-label="Delete task"
                        icon={<DeleteIcon />}
                        variant="ghost"
                        colorScheme="red"
                        onClick={() => deleteTodo(todo.id)}
                      />
                    </Flex>
                  ))
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
