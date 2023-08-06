import { gql } from 'graphql-tag';

export const syntheticsDirective = gql`
  scalar ErrorRate

  directive @synthetics(
    """
    The synthetic timeout configured for the field.
    """
    timeout: Int

    """
    The synthetic error rate configured for the field.
    """
    errorRate: ErrorRate

    """
    Enable or disable synthetics for the field.
    """
    enabled: Boolean = true
  ) on FIELD
`;
