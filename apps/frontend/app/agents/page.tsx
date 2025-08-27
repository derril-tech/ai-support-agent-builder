'use client';
import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Heading,
  HStack,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  Stack,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  Badge,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Textarea,
  Select,
  VStack,
  Flex,
  Spacer,
} from '@chakra-ui/react';
import { SearchIcon, AddIcon, EditIcon, DeleteIcon, ViewIcon } from '@chakra-ui/icons';

interface Agent {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'active' | 'archived';
  channel: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([
    {
      id: '1',
      name: 'Customer Support Bot',
      description: 'Handles general customer inquiries and support requests',
      status: 'active',
      channel: 'web',
      createdAt: '2024-01-15',
      updatedAt: '2024-01-20',
      version: 2,
    },
    {
      id: '2',
      name: 'Sales Assistant',
      description: 'Qualifies leads and provides product information',
      status: 'draft',
      channel: 'slack',
      createdAt: '2024-01-10',
      updatedAt: '2024-01-18',
      version: 1,
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    channel: 'web',
  });

  const filteredAgents = agents.filter(agent =>
    agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = () => {
    setEditingAgent(null);
    setFormData({ name: '', description: '', channel: 'web' });
    onOpen();
  };

  const handleEdit = (agent: Agent) => {
    setEditingAgent(agent);
    setFormData({
      name: agent.name,
      description: agent.description,
      channel: agent.channel,
    });
    onOpen();
  };

  const handleSave = () => {
    if (editingAgent) {
      setAgents(agents.map(agent =>
        agent.id === editingAgent.id
          ? { ...agent, ...formData, updatedAt: new Date().toISOString().split('T')[0] }
          : agent
      ));
    } else {
      const newAgent: Agent = {
        id: Date.now().toString(),
        ...formData,
        status: 'draft',
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
        version: 1,
      };
      setAgents([...agents, newAgent]);
    }
    onClose();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green';
      case 'draft': return 'yellow';
      case 'archived': return 'gray';
      default: return 'gray';
    }
  };

  return (
    <Box p={8}>
      <Stack spacing={6}>
        <Flex align="center">
          <Heading>AI Agents</Heading>
          <Spacer />
          <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={handleCreate}>
            Create Agent
          </Button>
        </Flex>

        <Card>
          <CardBody>
            <InputGroup>
              <InputLeftElement>
                <SearchIcon color="gray.400" />
              </InputLeftElement>
              <Input
                placeholder="Search agents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <Heading size="md">All Agents ({filteredAgents.length})</Heading>
          </CardHeader>
          <CardBody>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Name</Th>
                  <Th>Description</Th>
                  <Th>Channel</Th>
                  <Th>Status</Th>
                  <Th>Version</Th>
                  <Th>Updated</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredAgents.map((agent) => (
                  <Tr key={agent.id}>
                    <Td>
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="medium">{agent.name}</Text>
                        <Text fontSize="sm" color="gray.500">ID: {agent.id}</Text>
                      </VStack>
                    </Td>
                    <Td>
                      <Text noOfLines={2}>{agent.description}</Text>
                    </Td>
                    <Td>
                      <Badge variant="outline">{agent.channel}</Badge>
                    </Td>
                    <Td>
                      <Badge colorScheme={getStatusColor(agent.status)}>
                        {agent.status}
                      </Badge>
                    </Td>
                    <Td>
                      <Text>v{agent.version}</Text>
                    </Td>
                    <Td>
                      <Text fontSize="sm">{agent.updatedAt}</Text>
                    </Td>
                    <Td>
                      <HStack spacing={2}>
                        <Button size="sm" leftIcon={<ViewIcon />}>
                          View
                        </Button>
                        <Button size="sm" leftIcon={<EditIcon />} onClick={() => handleEdit(agent)}>
                          Edit
                        </Button>
                        <Button size="sm" leftIcon={<DeleteIcon />} colorScheme="red">
                          Delete
                        </Button>
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </CardBody>
        </Card>
      </Stack>

      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {editingAgent ? 'Edit Agent' : 'Create New Agent'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Name</FormLabel>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter agent name"
                />
              </FormControl>
              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what this agent does"
                  rows={3}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Channel</FormLabel>
                <Select
                  value={formData.channel}
                  onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
                >
                  <option value="web">Web Widget</option>
                  <option value="slack">Slack</option>
                  <option value="teams">Microsoft Teams</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="email">Email</option>
                  <option value="voice">Voice</option>
                </Select>
              </FormControl>
              <HStack spacing={4} w="full">
                <Button onClick={onClose} flex={1}>
                  Cancel
                </Button>
                <Button colorScheme="blue" onClick={handleSave} flex={1}>
                  {editingAgent ? 'Update' : 'Create'}
                </Button>
              </HStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}

