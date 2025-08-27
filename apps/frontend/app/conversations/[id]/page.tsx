'use client';
import { Box, Button, Heading, HStack, Stack, Text } from '@chakra-ui/react';

export default function ConversationView() {
  const messages = [
    { role: 'user', content: 'Hello' },
    { role: 'assistant', content: 'Hi! How can I help?' },
  ];
  const escalate = () => {
    // TODO: call API
    alert('Escalated to human');
  };
  const submitCsat = (rating: number) => {
    // TODO: call API
    alert(`CSAT submitted: ${rating}`);
  };
  return (
    <Box p={8}>
      <Heading mb={4}>Conversation</Heading>
      <Stack spacing={2} mb={4}>
        {messages.map((m, i) => (
          <Box key={i}>
            <Text fontSize="sm" color="gray.500">{m.role}</Text>
            <Text>{m.content}</Text>
          </Box>
        ))}
      </Stack>
      <HStack>
        <Button onClick={() => submitCsat(5)} size="sm">CSAT 5★</Button>
        <Button onClick={escalate} size="sm" colorScheme="orange">Escalate</Button>
      </HStack>
    </Box>
  );
}
