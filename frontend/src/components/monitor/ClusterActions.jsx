import Button from '../common/Button';

export default function ClusterActions({ loadingAction, onSwitchOver, onLaunchVmManager }) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      <Button loading={loadingAction === 'switchover'} onClick={onSwitchOver}>
        Switch Over
      </Button>
      <Button loading={loadingAction === 'vm-manager'} onClick={onLaunchVmManager}>
        Launch Virtual Machine Manager
      </Button>
    </div>
  );
}
