const emailQueueService = require('./email_queue.service');
const emailProgressService = require('./email_progress.service');

/**
 * Xử lý chuyển email từ queue sang progress
 * @returns {Promise<number>} Số lượng email đã chuyển
 */
const processEmailQueue = async () => {
  try {
    // Lấy danh sách email cần chuyển
    const emailsToTransfer = await emailQueueService.getEmailsToTransfer();
    console.log(`Found ${emailsToTransfer.length} emails to transfer from queue to progress`);

    // Chuyển từng email từ queue sang progress
    let transferredCount = 0;
    for (const emailQueue of emailsToTransfer) {
      try {
        await emailProgressService.transferToProgress(emailQueue);
        transferredCount++;
      } catch (error) {
        console.error(`Error transferring email ${emailQueue.id} to progress:`, error);
        // Đánh dấu là lỗi nếu không thể chuyển
        await emailQueueService.updateQueueStatus(emailQueue.id, 'failed');
      }
    }

    return transferredCount;
  } catch (error) {
    console.error('Error processing email queue:', error);
    throw error;
  }
};

/**
 * Xử lý gửi email trong progress
 * @returns {Promise<boolean>} Kết quả xử lý
 */
const processEmailProgress = async () => {
  try {
    // Lấy email tiếp theo cần xử lý
    const emailToProcess = await emailProgressService.getNextEmailToProcess();
    
    if (!emailToProcess) {
      // Không có email nào cần xử lý
      return false;
    }
    
    console.log(`Processing email ${emailToProcess.id} for ${emailToProcess.recipient_email}`);
    
    // Gửi email
    const result = await emailProgressService.sendEmail(emailToProcess);
    return result;
  } catch (error) {
    console.error('Error processing email progress:', error);
    return false;
  }
};

/**
 * Khởi tạo quy trình xử lý email với thời gian chạy định kỳ
 * @param {number} queueInterval - Thời gian giữa các lần chạy xử lý queue (ms)
 * @param {number} progressInterval - Thời gian giữa các lần chạy xử lý progress (ms)
 */
const initializeEmailProcessor = (queueInterval = 60000, progressInterval = 15000) => {
  // Xử lý chuyển từ queue sang progress mỗi phút
  setInterval(async () => {
    try {
      const transferredCount = await processEmailQueue();
      if (transferredCount > 0) {
        console.log(`Transferred ${transferredCount} emails from queue to progress`);
      }
    } catch (error) {
      console.error('Error in email queue processing interval:', error);
    }
  }, queueInterval);

  // Xử lý gửi email mỗi 15 giây
  setInterval(async () => {
    try {
      const result = await processEmailProgress();
      if (result) {
        console.log('Successfully sent an email from progress');
      }
    } catch (error) {
      console.error('Error in email progress processing interval:', error);
    }
  }, progressInterval);

  console.log(`Email processor initialized (Queue: ${queueInterval}ms, Progress: ${progressInterval}ms)`);
};

module.exports = {
  processEmailQueue,
  processEmailProgress,
  initializeEmailProcessor
}; 