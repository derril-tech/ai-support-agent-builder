'use client';
import { Box, Button, Heading, Input, Stack, Table, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/react';

export default function KnowledgePage() {
  const collections = [{ id: 'col-1', name: 'Docs', description: 'Product docs' }];
  return (
    <Box p={8}>
      <Heading mb={4}>Knowledge Uploader</Heading>
      <Stack direction="row" mb={6}>
        <Input type="file" />
        <Button colorScheme="blue">Upload</Button>
      </Stack>
      <Heading size="md" mb={3}>Collections</Heading>
      <Table>
        <Thead><Tr><Th>Name</Th><Th>Description</Th><Th>Actions</Th></Tr></Thead>
        <Tbody>
          {collections.map(c => (
            <Tr key={c.id}>
              <Td>{c.name}</Td>
              <Td>{c.description}</Td>
              <Td><Button size="sm">Reindex</Button></Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
}
