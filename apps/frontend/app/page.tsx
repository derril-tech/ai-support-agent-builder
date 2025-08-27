'use client';
import { useEffect, useRef, useState } from 'react';
import { Box, Button, Heading, HStack, Input, Stack, Text, VStack } from '@chakra-ui/react';

export default function Home() {
  const [conversationId, setConversationId] = useState<string>('conv-id-stub');
  const [tokens, setTokens] = useState<string[]>([]);
  const eventSourceRef = useRef<EventSource | null>(null);

  const startStream = () => {
    if (eventSourceRef.current) eventSourceRef.current.close();
    const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/v1/conversations/${conversationId}/stream`;
    const es = new EventSource(url);
    es.onmessage = (ev) => {
      try {
        const payload = JSON.parse(ev.data);
        setTokens((prev) => [...prev, payload.token || '']);
      } catch {}
    };
    eventSourceRef.current = es;
  };

  useEffect(() => () => eventSourceRef.current?.close(), []);

  return (
    <Stack p={8} spacing={6}>
      <Heading>AI Support Agent Studio</Heading>
      <VStack align="stretch" spacing={4}>
        <HStack>
          <Input value={conversationId} onChange={(e) => setConversationId(e.target.value)} placeholder="Conversation ID" />
          <Button onClick={startStream}>Start SSE</Button>
        </HStack>
        <Box borderWidth="1px" borderRadius="md" p={4} minH="120px">
          <Text fontWeight="bold">Tokens</Text>
          <Text whiteSpace="pre-wrap">{tokens.join('')}</Text>
        </Box>
      </VStack>
    </Stack>
  );
}
