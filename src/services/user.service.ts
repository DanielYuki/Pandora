import axios from 'axios';
import config from '@/utils/config';
import logger from '@/utils/logger';
import { User } from '@/core/entities';

interface GraphQLResponse {
  data?: {
    userByPhone?: User | null;
  };
  errors?: Array<{
    message: string;
  }>;
}

// TODO: Update and add more functions to this service, to offload some logic on other services/servers
export class UserService {
  // TODO: Review constructor logic for server
  private graphqlUrl: string = '';

  constructor() {
    if (config.LIVUS_SERVER_URL) {
      this.graphqlUrl = config.LIVUS_SERVER_URL;
      logger.info(`🔍 Livus Server configured: ${this.graphqlUrl}`);
    } else {
      logger.warn('⚠️ Livus Server is not configured');
    }
  }

  /**
   * Check if user exists by phone number
   * Returns true if user exists, false otherwise
   */
  async isUserRegistered(phoneNumber: string): Promise<boolean> {
    try {
      logger.debug(`🔍 Checking if user exists with phone: ${phoneNumber}`);

      const query = `
        query GetUserByPhone($phone: String!) {
          userByPhone(phone: $phone) {
            _id
            name
            email
            phone
            role
          }
        }
      `;

      const response = await axios.post<GraphQLResponse>(
        this.graphqlUrl,
        {
          query,
          variables: { phone: phoneNumber },
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000, // 10 second timeout
        }
      );

      if (response.data.errors) {
        logger.error('GraphQL errors:', response.data.errors);
        return false;
      }

      const user = response.data.data?.userByPhone;
      if (user) {
        logger.debug(`✅ User found: ${user.name} (${user.email})`);
        return true;
      } else {
        logger.debug(`❌ No user found with phone: ${phoneNumber}`);
        return false;
      }
    } catch (error) {
      logger.error(`❌ Error checking user registration for ${phoneNumber}:`, error);
      return false; // Fail closed for security
    }
  }

  /**
   * Get user details by phone number
   * Returns user object if found, null otherwise
   */
  // TODO: if we use this, we might need to implement something for security, like a token or something (this function might help the AI Agent server)
  async getUserByPhone(phoneNumber: string): Promise<User | null> {
    try {
      logger.debug(`🔍 Fetching user details for phone: ${phoneNumber}`);

      const query = `
        query GetUserByPhone($phone: String!) {
          userByPhone(phone: $phone) {
            _id
            name
            email
            phone
            role
            created_at
            updated_at
          }
        }
      `;

      const response = await axios.post<GraphQLResponse>(
        this.graphqlUrl,
        {
          query,
          variables: { phone: phoneNumber },
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      if (response.data.errors) {
        logger.error('GraphQL errors:', response.data.errors);
        return null;
      }

      const user = response.data.data?.userByPhone;
      if (user) {
        logger.debug(`✅ User details fetched: ${user.name} (${user.email})`);
        return user;
      } else {
        logger.debug(`❌ No user found with phone: ${phoneNumber}`);
        return null;
      }
    } catch (error) {
      logger.error(`❌ Error fetching user details for ${phoneNumber}:`, error);
      return null;
    }
  }
}
