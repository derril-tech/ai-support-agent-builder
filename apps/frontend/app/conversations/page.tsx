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
  VStack,
  Text,
  Badge,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  Flex,
  Spacer,
  Avatar,
  IconButton,
  Tooltip,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Divider,
} from '@chakra-ui/react';
import { SearchIcon, FilterIcon, ViewIcon, DownloadIcon, StarIcon } from '@chakra-ui/icons';

interface Conversation {
  id: string;
  agentId: string;
  agentName: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  status: 'active' | 'resolved' | 'escalated' | 'closed';
  channel: string;
  startedAt: string;
  lastMessageAt: string;
  messageCount: number;
  satisfaction?: number;
  tags: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

interface Message {
  id: string;
  conversationId: string;
  sender: 'customer' | 'agent' | 'system';
  content: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: 'conv-1',
      agentId: 'agent-1',
      agentName: 'Customer Support Bot',
      customerId: 'cust-1',
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      status: 'active',
      channel: 'web',
      startedAt: '2024-01-20 10:30',
      lastMessageAt: '2024-01-20 14:45',
      messageCount: 12,
      satisfaction: 4,
      tags: ['billing', 'urgent'],
      priority: 'high',
    },
    {
      id: 'conv-2',
      agentId: 'agent-1',
      agentName: 'Customer Support Bot',
      customerId: 'cust-2',
      customerName: 'Jane Smith',
      customerEmail: 'jane@example.com',
      status: 'resolved',
      channel: 'slack',
      startedAt: '2024-01-19 15:20',
      lastMessageAt: '2024-01-20 09:15',
      messageCount: 8,
      satisfaction: 5,
      tags: ['technical', 'resolved'],
      priority: 'medium',
    },
    {
      id: 'conv-3',
      agentId: 'agent-2',
      agentName: 'Sales Assistant',
      customerId: 'cust-3',
      customerName: 'Bob Wilson',
      customerEmail: 'bob@example.com',
      status: 'escalated',
      channel: 'email',
      startedAt: '2024-01-18 11:00',
      lastMessageAt: '2024-01-20 16:30',
      messageCount: 15,
      tags: ['sales', 'escalated'],
      priority: 'urgent',
    },
  ]);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg-1',
      conversationId: 'conv-1',
      sender: 'customer',
      content: 'Hi, I have a question about my billing statement.',
      timestamp: '2024-01-20 10:30',
    },
    {
      id: 'msg-2',
      conversationId: 'conv-1',
      sender: 'agent',
      content: 'Hello! I\'d be happy to help you with your billing question. Could you please provide your account number?',
      timestamp: '2024-01-20 10:31',
    },
    {
      id: 'msg-3',
      conversationId: 'conv-1',
      sender: 'customer',
      content: 'My account number is 12345. I noticed an unexpected charge of $50 on my statement.',
      timestamp: '2024-01-20 10:32',
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [channelFilter, setChannelFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  const filteredConversations = conversations.filter(conversation => {
    const matchesSearch = 
      conversation.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conversation.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conversation.agentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conversation.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = !statusFilter || conversation.status === statusFilter;
    const matchesChannel = !channelFilter || conversation.channel === channelFilter;
    const matchesPriority = !priorityFilter || conversation.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesChannel && matchesPriority;
  });

  const handleViewConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    onOpen();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'blue';
      case 'resolved': return 'green';
      case 'escalated': return 'orange';
      case 'closed': return 'gray';
      default: return 'gray';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'red';
      case 'high': return 'orange';
      case 'medium': return 'yellow';
      case 'low': return 'green';
      default: return 'gray';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <Box p={8}>
      <VStack spacing={6} align="stretch">
        <Flex align="center">
          <Heading>Conversations</Heading>
          <Spacer />
          <HStack spacing={4}>
            <Button leftIcon={<DownloadIcon />} variant="outline">
              Export
            </Button>
            <Button leftIcon={<FilterIcon />} variant="outline">
              Advanced Filters
            </Button>
          </HStack>
        </Flex>

        {/* Filters */}
        <Card>
          <CardBody>
            <HStack spacing={4}>
              <InputGroup flex={1}>
                <InputLeftElement>
                  <SearchIcon color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
              <Select
                placeholder="All Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                w="150px"
              >
                <option value="active">Active</option>
                <option value="resolved">Resolved</option>
                <option value="escalated">Escalated</option>
                <option value="closed">Closed</option>
              </Select>
              <Select
                placeholder="All Channels"
                value={channelFilter}
                onChange={(e) => setChannelFilter(e.target.value)}
                w="150px"
              >
                <option value="web">Web</option>
                <option value="slack">Slack</option>
                <option value="email">Email</option>
                <option value="whatsapp">WhatsApp</option>
              </Select>
              <Select
                placeholder="All Priorities"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                w="150px"
              >
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </Select>
            </HStack>
          </CardBody>
        </Card>

        {/* Conversations Table */}
        <Card>
          <CardHeader>
            <Flex align="center">
              <Heading size="md">All Conversations ({filteredConversations.length})</Heading>
              <Spacer />
              <Text fontSize="sm" color="gray.500">
                Showing {filteredConversations.length} of {conversations.length}
              </Text>
            </Flex>
          </CardHeader>
          <CardBody>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Customer</Th>
                  <Th>Agent</Th>
                  <Th>Status</Th>
                  <Th>Channel</Th>
                  <Th>Priority</Th>
                  <Th>Messages</Th>
                  <Th>Last Activity</Th>
                  <Th>Satisfaction</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredConversations.map((conversation) => (
                  <Tr key={conversation.id} cursor="pointer" onClick={() => handleViewConversation(conversation)}>
                    <Td>
                      <HStack spacing={3}>
                        <Avatar size="sm" name={conversation.customerName} />
                        <VStack align="start" spacing={1}>
                          <Text fontWeight="medium">{conversation.customerName}</Text>
                          <Text fontSize="sm" color="gray.500">{conversation.customerEmail}</Text>
                        </VStack>
                      </HStack>
                    </Td>
                    <Td>
                      <Text>{conversation.agentName}</Text>
                    </Td>
                    <Td>
                      <Badge colorScheme={getStatusColor(conversation.status)}>
                        {conversation.status}
                      </Badge>
                    </Td>
                    <Td>
                      <Badge variant="outline">{conversation.channel}</Badge>
                    </Td>
                    <Td>
                      <Badge colorScheme={getPriorityColor(conversation.priority)}>
                        {conversation.priority}
                      </Badge>
                    </Td>
                    <Td>
                      <Text>{conversation.messageCount}</Text>
                    </Td>
                    <Td>
                      <Text fontSize="sm">{formatTimeAgo(conversation.lastMessageAt)}</Text>
                    </Td>
                    <Td>
                      {conversation.satisfaction ? (
                        <HStack>
                          <StarIcon color="yellow.400" />
                          <Text fontSize="sm">{conversation.satisfaction}/5</Text>
                        </HStack>
                      ) : (
                        <Text fontSize="sm" color="gray.400">-</Text>
                      )}
                    </Td>
                    <Td>
                      <HStack spacing={2}>
                        <Tooltip label="View conversation">
                          <IconButton
                            size="sm"
                            icon={<ViewIcon />}
                            aria-label="View conversation"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewConversation(conversation);
                            }}
                          />
                        </Tooltip>
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </CardBody>
        </Card>
      </VStack>

      {/* Conversation Detail Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="6xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack>
              <Avatar size="sm" name={selectedConversation?.customerName} />
              <VStack align="start" spacing={0}>
                <Text fontWeight="medium">{selectedConversation?.customerName}</Text>
                <Text fontSize="sm" color="gray.500">{selectedConversation?.customerEmail}</Text>
              </VStack>
              <Spacer />
              <Badge colorScheme={getStatusColor(selectedConversation?.status || '')}>
                {selectedConversation?.status}
              </Badge>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Tabs>
              <TabList>
                <Tab>Messages</Tab>
                <Tab>Details</Tab>
                <Tab>Analytics</Tab>
              </TabList>
              <TabPanels>
                <TabPanel>
                  <VStack spacing={4} align="stretch">
                    {messages.map((message) => (
                      <Box
                        key={message.id}
                        alignSelf={message.sender === 'customer' ? 'flex-start' : 'flex-end'}
                        maxW="70%"
                      >
                        <Card
                          bg={message.sender === 'customer' ? 'gray.50' : 'blue.50'}
                          variant="outline"
                        >
                          <CardBody>
                            <VStack align="start" spacing={2}>
                              <HStack>
                                <Text fontSize="sm" fontWeight="medium">
                                  {message.sender === 'customer' ? selectedConversation?.customerName : selectedConversation?.agentName}
                                </Text>
                                <Text fontSize="xs" color="gray.500">
                                  {new Date(message.timestamp).toLocaleString()}
                                </Text>
                              </HStack>
                              <Text>{message.content}</Text>
                            </VStack>
                          </CardBody>
                        </Card>
                      </Box>
                    ))}
                  </VStack>
                </TabPanel>
                <TabPanel>
                  <VStack spacing={4} align="stretch">
                    <Card>
                      <CardHeader>
                        <Heading size="sm">Conversation Details</Heading>
                      </CardHeader>
                      <CardBody>
                        <VStack spacing={3} align="stretch">
                          <HStack justify="space-between">
                            <Text fontWeight="medium">Conversation ID:</Text>
                            <Text>{selectedConversation?.id}</Text>
                          </HStack>
                          <HStack justify="space-between">
                            <Text fontWeight="medium">Started:</Text>
                            <Text>{selectedConversation?.startedAt}</Text>
                          </HStack>
                          <HStack justify="space-between">
                            <Text fontWeight="medium">Channel:</Text>
                            <Badge variant="outline">{selectedConversation?.channel}</Badge>
                          </HStack>
                          <HStack justify="space-between">
                            <Text fontWeight="medium">Priority:</Text>
                            <Badge colorScheme={getPriorityColor(selectedConversation?.priority || '')}>
                              {selectedConversation?.priority}
                            </Badge>
                          </HStack>
                          <HStack justify="space-between">
                            <Text fontWeight="medium">Tags:</Text>
                            <HStack>
                              {selectedConversation?.tags.map((tag) => (
                                <Badge key={tag} size="sm" variant="subtle">
                                  {tag}
                                </Badge>
                              ))}
                            </HStack>
                          </HStack>
                        </VStack>
                      </CardBody>
                    </Card>
                  </VStack>
                </TabPanel>
                <TabPanel>
                  <Text>Analytics data will be displayed here.</Text>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}
