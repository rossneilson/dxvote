import { Button } from 'components/Guilds/common/Button';
import { Box } from 'components/Guilds/common/Layout';
import UnstyledLink from 'components/Guilds/common/UnstyledLink';
import { BigNumber } from 'ethers';
import { FiExternalLink } from 'react-icons/fi';
import styled, { useTheme } from 'styled-components';
import { ActionViewProps } from '../SupportedActions';
import { MetadataTag } from '../SupportedActions/common/infoLine';
import { DetailRow } from '../SupportedActions/common/summary';

const ParamTag = styled(MetadataTag)`
  border-radius: ${({ theme }) => theme.radii.pill};
  margin: 0 0.25rem;
  color: ${({ color }) => color};
`;

const ParamTitleRow = styled(DetailRow)`
  margin-bottom: 0.75rem;
`;

const ParamTitleTag = styled(MetadataTag)`
  display: inline-block;
  padding: 0.375rem 0.5rem;
  color: ${({ color }) => color};
`;

const ActionParamRow = styled(Box)`
  margin-bottom: 1.5rem;
`;

const ParamDetail = styled(Box)`
  color: ${({ theme }) => theme.colors.proposalText.grey};
  overflow-wrap: break-word;
`;

const CallDetails: React.FC<ActionViewProps> = ({ decodedCall }) => {
  const theme = useTheme();

  function renderByParamType(type: string, value: any) {
    if (!type || !value) return null;

    if (type === 'address') {
      return (
        <UnstyledLink href="#">
          <ParamDetail>
            {value} <FiExternalLink size={16} />
          </ParamDetail>
        </UnstyledLink>
      );
    }

    if (type.startsWith('uint') || type.startsWith('int')) {
      return <ParamDetail>{BigNumber.from(value).toString()}</ParamDetail>;
    }

    return <ParamDetail>{value}</ParamDetail>;
  }

  return (
    <>
      <ActionParamRow>
        <Box>
          {decodedCall?.function?.name} (
          {decodedCall?.function?.inputs.map((param, index, params) => (
            <span key={index}>
              <ParamTag color={theme?.colors?.params?.[index]}>
                {param?.type}
              </ParamTag>
              {index < params.length - 1 && <span> , </span>}
            </span>
          ))}
          )
        </Box>
      </ActionParamRow>

      {decodedCall?.function?.inputs?.map((param, index) => (
        <ActionParamRow key={index}>
          <ParamTitleRow>
            <ParamTitleTag color={theme?.colors?.params?.[index]}>
              {param.name} <em>({param.type})</em>
            </ParamTitleTag>
            {param.type === 'bytes' && (
              <Button variant="secondary">Decode</Button>
            )}
          </ParamTitleRow>

          {renderByParamType(param.type, decodedCall?.args?.[param.name])}
        </ActionParamRow>
      ))}
    </>
  );
};

export default CallDetails;
