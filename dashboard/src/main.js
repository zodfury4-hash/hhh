import {
  state, setAppUser, setProStatus, isUserAuthenticated, openWhatModal, closeWhatModal,
  toast, copy, updateDisplayName, deleteLink, deleteQr, deletePage, exportAnalyticsCSV
} from './modules/state.js';
import {
  isUserPro, canCreateLinkOrQr, recordFreeCreation, canChatWithAssist, recordFreeChat,
  drawQR, lockModalScroll, unlockModalScroll, openCheckoutModal, closeCheckoutModal, setupCheckoutModal
} from './modules/billing.js';
import { downloadQrPNG, downloadQrSVG, changeQrColor } from './modules/qr.js';
import { navigate, route, init } from './modules/router.js';

window.state = state;
window.isUserPro = isUserPro;
window.canCreateLinkOrQr = canCreateLinkOrQr;
window.recordFreeCreation = recordFreeCreation;
window.canChatWithAssist = canChatWithAssist;
window.recordFreeChat = recordFreeChat;
window.lockModalScroll = lockModalScroll;
window.unlockModalScroll = unlockModalScroll;
window.openCheckoutModal = openCheckoutModal;
window.closeCheckoutModal = closeCheckoutModal;
window.drawQR = drawQR;
window.toast = toast;
window.copy = copy;

window.appShell = {
  navigate,
  setAppUser,
  setProStatus,
  isUserAuthenticated,
  openWhatModal,
  closeWhatModal,
  downloadQrPNG,
  downloadQrSVG,
  changeQrColor,
  toast,
  copy,
  updateDisplayName,
  deleteLink,
  deleteQr,
  deletePage,
  exportAnalyticsCSV
};

window.addEventListener('hashchange', route);
setupCheckoutModal();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { init(); route(); });
} else {
  init();
  route();
}
