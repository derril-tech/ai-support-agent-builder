'use client';
import { useState, useEffect } from 'react';
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
  Avatar,
  Flex,
  Spacer,
  Grid,
  GridItem,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Textarea,
  Input,
  Divider,
  IconButton,
  Tooltip,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import { 
  ChatIcon, 
  PhoneIcon, 
  CheckIcon, 
  CloseIcon, 
  TimeIcon,
  StarIcon,
  InfoIcon,
  SettingsIcon,
} from '@chakra-ui/icons';

interface Operator {
  id: string;
  name: string;
  email: string;
  status: 'online' | 'busy' | 'away' | 'offline';
  avatar: string;
  currentConversations: number;
  maxConversations: number;
  skills: string[];
  lastActive: string;
}

interface HandoffRequest {
  id: string;
  conversationId: string;
  customerName: string;
  customerEmail: string;
  agentName: string;
  reason: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  requestedAt: string;
  acceptedAt?: string;
  completedAt?: string;
  notes?: string;
}

interface Conversation {
  id: string;
  customerName: string;
  customerEmail: string;
  agentName: string;
  status: 'active' | 'waiting' | 'handoff' | 'resolved';
  channel: string;
  startedAt: string;
  lastMessageAt: string;
  messageCount: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export default function OperatorPage() {
  const [operators, setOperators] = useState<Operator[]>([
    {
      id: 'op-1',
      name: 'Sarah Johnson',
      email: 'sarah@company.com',
      status: 'online',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150',
      currentConversations: 2,
      maxConversations: 5,
      skills: ['billing', 'technical', 'sales'],
      lastActive: '2024-01-20 16:45',
    },
    {
      id: 'op-2',
      name: 'Mike Chen',
      email: 'mike@company.com',
      status: 'busy',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
      currentConversations: 4,
      maxConversations: 5,
      skills: ['technical', 'escalation'],
      lastActive: '2024-01-20 16:42',
    },
    {
      id: 'op-3',
      name: 'Emily Davis',
      email: 'emily@company.com',
      status: 'away',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
      currentConversations: 0,
      maxConversations: 5,
      skills: ['billing', 'general'],
      lastActive: '2024-01-20 16:30',
    },
  ]);

  const [handoffRequests, setHandoffRequests] = useState<HandoffRequest[]>([
    {
      id: 'handoff-1',
      conversationId: 'conv-1',
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      agentName: 'Customer Support Bot',
      reason: 'Complex billing issue requiring human intervention',
      priority: 'high',
      status: 'pending',
      requestedAt: '2024-01-20 16:40',
    },
    {
      id: 'handoff-2',
      conversationId: 'conv-3',
      customerName: 'Bob Wilson',
      customerEmail: 'bob@example.com',
      agentName: 'Sales Assistant',
      reason: 'Customer wants to speak with sales representative',
      priority: 'urgent',
      status: 'accepted',
      requestedAt: '2024-01-20 16:35',
      acceptedAt: '2024-01-20 16:38',
    },
  ]);

  const [activeConversations, setActiveConversations] = useState<Conversation[]>([
    {
      id: 'conv-1',
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      agentName: 'Sarah Johnson',
      status: 'handoff',
      channel: 'web',
      startedAt: '2024-01-20 10:30',
      lastMessageAt: '2024-01-20 16:45',
      messageCount: 15,
      priority: 'high',
    },
    {
      id: 'conv-3',
      customerName: 'Bob Wilson',
      customerEmail: 'bob@example.com',
      agentName: 'Mike Chen',
      status: 'active',
      channel: 'email',
      startedAt: '2024-01-20 11:00',
      lastMessageAt: '2024-01-20 16:42',
      messageCount: 8,
      priority: 'urgent',
    },
  ]);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedHandoff, setSelectedHandoff] = useState<HandoffRequest | null>(null);
  const [responseMessage, setResponseMessage] = useState('');

  const handleAcceptHandoff = (handoffId: string) => {
    setHandoffRequests(handoffRequests.map(handoff =>
      handoff.id === handoffId
        ? { ...handoff, status: 'accepted', acceptedAt: new Date().toISOString() }
        : handoff
    ));
  };

  const handleRejectHandoff = (handoffId: string) => {
    setHandoffRequests(handoffRequests.map(handoff =>
      handoff.id === handoffId
        ? { ...handoff, status: 'rejected' }
        : handoff
    ));
  };

  const handleCompleteHandoff = (handoffId: string) => {
    setHandoffRequests(handoffRequests.map(handoff =>
      handoff.id === handoffId
        ? { ...handoff, status: 'completed', completedAt: new Date().toISOString() }
        : handoff
    ));
  };

  const handleRespondToHandoff = (handoff: HandoffRequest) => {
    setSelectedHandoff(handoff);
    onOpen();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'green';
      case 'busy': return 'orange';
      case 'away': return 'yellow';
      case 'offline': return 'gray';
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

  const getHandoffStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'yellow';
      case 'accepted': return 'blue';
      case 'rejected': return 'red';
      case 'completed': return 'green';
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
          <Heading>Operator Console</Heading>
          <Spacer />
          <HStack spacing={4}>
            <Button leftIcon={<SettingsIcon />} variant="outline">
              Settings
            </Button>
            <Button leftIcon={<InfoIcon />} variant="outline">
              Help
            </Button>
          </HStack>
        </Flex>

        <Grid templateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap={6}>
          {/* Operator Status */}
          <GridItem colSpan={{ base: 1, lg: 2 }}>
            <Card>
              <CardHeader>
                <Heading size="md">Team Status</Heading>
              </CardHeader>
              <CardBody>
                <Grid templateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap={4}>
                  {operators.map((operator) => (
                    <Card key={operator.id} variant="outline">
                      <CardBody>
                        <HStack spacing={4}>
                          <Avatar size="md" src={operator.avatar} name={operator.name} />
                          <VStack align="start" spacing={1} flex={1}>
                            <HStack>
                              <Text fontWeight="medium">{operator.name}</Text>
                              <Badge colorScheme={getStatusColor(operator.status)}>
                                {operator.status}
                              </Badge>
                            </HStack>
                            <Text fontSize="sm" color="gray.500">{operator.email}</Text>
                            <Text fontSize="sm">
                              {operator.currentConversations}/{operator.maxConversations} conversations
                            </Text>
                            <HStack spacing={1}>
                              {operator.skills.map((skill) => (
                                <Badge key={skill} size="sm" variant="subtle">
                                  {skill}
                                </Badge>
                              ))}
                            </HStack>
                            <Text fontSize="xs" color="gray.400">
                              Last active: {formatTimeAgo(operator.lastActive)}
                            </Text>
                          </VStack>
                        </HStack>
                      </CardBody>
                    </Card>
                  ))}
                </Grid>
              </CardBody>
            </Card>
          </GridItem>

          {/* Handoff Requests */}
          <GridItem>
            <Card>
              <CardHeader>
                <Heading size="md">Handoff Requests</Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  {handoffRequests.filter(h => h.status === 'pending').map((handoff) => (
                    <Card key={handoff.id} variant="outline" borderColor={getPriorityColor(handoff.priority)}>
                      <CardBody>
                        <VStack align="stretch" spacing={3}>
                          <HStack justify="space-between">
                            <Text fontWeight="medium">{handoff.customerName}</Text>
                            <Badge colorScheme={getPriorityColor(handoff.priority)}>
                              {handoff.priority}
                            </Badge>
                          </HStack>
                          <Text fontSize="sm" color="gray.600">{handoff.reason}</Text>
                          <Text fontSize="xs" color="gray.400">
                            Requested {formatTimeAgo(handoff.requestedAt)}
                          </Text>
                          <HStack spacing={2}>
                            <Button
                              size="sm"
                              leftIcon={<CheckIcon />}
                              colorScheme="green"
                              onClick={() => handleAcceptHandoff(handoff.id)}
                            >
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              leftIcon={<CloseIcon />}
                              colorScheme="red"
                              onClick={() => handleRejectHandoff(handoff.id)}
                            >
                              Reject
                            </Button>
                            <Button
                              size="sm"
                              leftIcon={<ChatIcon />}
                              variant="outline"
                              onClick={() => handleRespondToHandoff(handoff)}
                            >
                              Respond
                            </Button>
                          </HStack>
                        </VStack>
                      </CardBody>
                    </Card>
                  ))}
                  {handoffRequests.filter(h => h.status === 'pending').length === 0 && (
                    <Text color="gray.500" textAlign="center" py={4}>
                      No pending handoff requests
                    </Text>
                  )}
                </VStack>
              </CardBody>
            </Card>
          </GridItem>

          {/* Active Conversations */}
          <GridItem>
            <Card>
              <CardHeader>
                <Heading size="md">Active Conversations</Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  {activeConversations.map((conversation) => (
                    <Card key={conversation.id} variant="outline">
                      <CardBody>
                        <VStack align="stretch" spacing={3}>
                          <HStack justify="space-between">
                            <Text fontWeight="medium">{conversation.customerName}</Text>
                            <Badge colorScheme={getPriorityColor(conversation.priority)}>
                              {conversation.priority}
                            </Badge>
                          </HStack>
                          <Text fontSize="sm" color="gray.600">
                            Assigned to: {conversation.agentName}
                          </Text>
                          <Text fontSize="sm">
                            {conversation.messageCount} messages • {conversation.channel}
                          </Text>
                          <Text fontSize="xs" color="gray.400">
                            Last activity: {formatTimeAgo(conversation.lastMessageAt)}
                          </Text>
                          <HStack spacing={2}>
                            <Button size="sm" leftIcon={<ChatIcon />}>
                              Join
                            </Button>
                            <Button size="sm" leftIcon={<PhoneIcon />} variant="outline">
                              Call
                            </Button>
                          </HStack>
                        </VStack>
                      </CardBody>
                    </Card>
                  ))}
                </VStack>
              </CardBody>
            </Card>
          </GridItem>
        </Grid>

        {/* Recent Handoffs */}
        <Card>
          <CardHeader>
            <Heading size="md">Recent Handoffs</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              {handoffRequests.map((handoff) => (
                <Card key={handoff.id} variant="outline">
                  <CardBody>
                    <HStack justify="space-between" align="start">
                      <VStack align="start" spacing={2} flex={1}>
                        <HStack>
                          <Text fontWeight="medium">{handoff.customerName}</Text>
                          <Badge colorScheme={getHandoffStatusColor(handoff.status)}>
                            {handoff.status}
                          </Badge>
                          <Badge colorScheme={getPriorityColor(handoff.priority)}>
                            {handoff.priority}
                          </Badge>
                        </HStack>
                        <Text fontSize="sm" color="gray.600">{handoff.reason}</Text>
                        <Text fontSize="xs" color="gray.400">
                          Requested {formatTimeAgo(handoff.requestedAt)}
                          {handoff.acceptedAt && ` • Accepted ${formatTimeAgo(handoff.acceptedAt)}`}
                          {handoff.completedAt && ` • Completed ${formatTimeAgo(handoff.completedAt)}`}
                        </Text>
                      </VStack>
                      {handoff.status === 'accepted' && (
                        <Button
                          size="sm"
                          leftIcon={<CheckIcon />}
                          colorScheme="green"
                          onClick={() => handleCompleteHandoff(handoff.id)}
                        >
                          Complete
                        </Button>
                      )}
                    </HStack>
                  </CardBody>
                </Card>
              ))}
            </VStack>
          </CardBody>
        </Card>
      </VStack>

      {/* Response Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            Respond to Handoff Request
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              {selectedHandoff && (
                <>
                  <Alert status="info">
                    <AlertIcon />
                    <VStack align="start" spacing={1}>
                      <AlertTitle>Handoff Request</AlertTitle>
                      <AlertDescription>
                        Customer: {selectedHandoff.customerName}<br />
                        Reason: {selectedHandoff.reason}<br />
                        Priority: {selectedHandoff.priority}
                      </AlertDescription>
                    </VStack>
                  </Alert>
                  <FormControl>
                    <FormLabel>Response Message</FormLabel>
                    <Textarea
                      value={responseMessage}
                      onChange={(e) => setResponseMessage(e.target.value)}
                      placeholder="Enter your response to the customer..."
                      rows={4}
                    />
                  </FormControl>
                  <HStack spacing={4} w="full">
                    <Button onClick={onClose} flex={1}>
                      Cancel
                    </Button>
                    <Button colorScheme="blue" onClick={onClose} flex={1}>
                      Send Response
                    </Button>
                  </HStack>
                </>
              )}
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}
