import styled, { keyframes } from 'styled-components';
import moment from 'moment';
import { useState } from 'react';
import { Modal } from '../Modal';
import { Row as CommonRow, BlockchainLink, Button } from '../common';
import { TokenVesting } from '../../types/types';
import { useContext } from '../../contexts';
import { toast } from 'react-toastify';
import { TXEvents, formatBalance } from '../../utils';
import { AiOutlineLoading } from 'react-icons/ai';

const Wrapper = styled.div`
  ${({ theme }) => theme.flexColumnWrap}
  padding: 0 24px;
  background-color: ${({ theme }) => theme.backgroundColor};
  text-align: center;
`;

const Row = styled(CommonRow)`
  justify-content: flex-start;
  &:first-child {
    padding: 0;
  }
`;

const StyledLink = styled(BlockchainLink)`
  margin-left: 4px;
  background: red;
  width: 300px;
`;

const StyledButton = styled(Button)`
  margin: 0;
`;

const Title = styled.h2`
  margin: 0;
`;

const SpinAnimation = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const Loading = styled.div`
  animation: ${SpinAnimation} 1s cubic-bezier(0.42, 0.8, 0.6, 0.83) infinite;
  width: fit-content;
  margin: 0 auto;
`;

export interface UserVestingInfoModalProps {
  onDismiss?: () => void;
  isOpen: boolean;
  contract?: TokenVesting;
  updateContracts: () => void;
}

const UserVestingInfoModal: React.FC<UserVestingInfoModalProps> = ({
  onDismiss,
  isOpen,
  contract,
  updateContracts,
}) => {
  const [loading, setLoading] = useState(false);
  const {
    context: { tokenVestingService },
  } = useContext();

  if (!contract) return null;

  const contractValue = formatBalance(contract.value);
  const cliff = moment.unix(Number(contract.cliff));
  const canRelease = !(
    !Number(contract.value.toString()) || moment().isBefore(cliff)
  );

  const handleRedeemClick = () => {
    setLoading(true);
    tokenVestingService
      .redeemVestedDxd(contract.address)
      .on(TXEvents.RECEIPT, hash => {
        console.debug('[TX_RECEIPT]', hash);
        toast.success(
          `Successfully redeemed ${contractValue}DXD from ${contract.address}`
        );
      })
      .on(TXEvents.TX_ERROR, txerror => {
        console.error('[TX_ERROR]', txerror);
        setLoading(false);
        toast.error(`Error: ${txerror?.message}`);
      })
      .on(TXEvents.INVARIANT, error => {
        console.error('[ERROR]', error);
        setLoading(false);
        toast.error(`Error: ${error?.message}`);
      })
      .on(TXEvents.FINALLY, hash => {
        console.debug('[TX_FINALLY]', hash);
        setLoading(false);
        updateContracts();
        onDismiss();
      })
      .catch(e => {
        toast.error(`Error: ${e?.message}`);
      });
  };

  const handleDismiss = () => {
    if (!loading) onDismiss();
  };

  return (
    <Modal
      header={<Title>Vesting Contract</Title>}
      isOpen={isOpen}
      onDismiss={handleDismiss}
      maxWidth={450}
    >
      <Wrapper>
        {loading ? (
          <div>
            <Loading>
              <AiOutlineLoading size={40} />
            </Loading>
            <br /> Waiting transaction..
          </div>
        ) : (
          <>
            <Row>
              <span>Contract Address: </span>
              <StyledLink text={contract.address} toCopy>
                {contract.address}↗
              </StyledLink>
            </Row>
            <Row>
              Start: {moment.unix(Number(contract.start)).format('LLL')}
            </Row>
            <Row>
              Cliff: {cliff.format('LLL')} (
              {moment.duration(cliff.diff(moment())).humanize(true)})
            </Row>
            <Row>
              Duration:{' '}
              {moment.duration(contract.duration, 'seconds').humanize()}
            </Row>

            <Row>Value: {contractValue} DXD</Row>
            <Row>Can Release: {canRelease ? 'Yes' : 'No'}</Row>
            <Row>
              <StyledButton disabled={!canRelease} onClick={handleRedeemClick}>
                Redeem DXD
              </StyledButton>
            </Row>
          </>
        )}
      </Wrapper>
    </Modal>
  );
};

export default UserVestingInfoModal;
