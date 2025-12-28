/**
 * Client-side helper function to send email notification when feedback is delivered
 * This can be used as a fallback if the database trigger doesn't work
 * 
 * @param {Object} feedbackData - The feedback data
 * @param {string} feedbackData.id - Feedback ID
 * @param {string} feedbackData.recipientEmail - Recipient email address
 * @param {string} feedbackData.recipientName - Recipient name
 * @param {string} feedbackData.senderName - Sender name
 * @param {string} feedbackData.feedbackText - The feedback text
 * @param {string} feedbackData.createdAt - Creation date
 * @returns {Promise<Object>} Response from the API
 */
export async function sendFeedbackDeliveredEmail(feedbackData) {
  try {
    const response = await fetch('/api/feedback/notify-delivered', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(feedbackData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send email notification');
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending email notification:', error);
    throw error;
  }
}

/**
 * Helper function to send email notification after updating feedback status to delivered
 * Call this after successfully updating the feedback status in the database
 * 
 * @param {Object} supabase - Supabase client instance
 * @param {string} feedbackId - The feedback ID
 * @returns {Promise<void>}
 */
export async function notifyFeedbackDelivered(supabase, feedbackId) {
  try {
    // Fetch feedback details
    const { data: feedback, error: fetchError } = await supabase
      .from('feedback')
      .select(`
        id,
        original_text,
        modified_text,
        created_at,
        sender_id,
        recipient_id
      `)
      .eq('id', feedbackId)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    // Fetch recipient and sender information
    const [recipientResult, senderResult] = await Promise.all([
      supabase
        .from('user')
        .select('email, full_name')
        .eq('id', feedback.recipient_id)
        .single(),
      supabase
        .from('user')
        .select('full_name')
        .eq('id', feedback.sender_id)
        .single(),
    ]);

    if (recipientResult.error || senderResult.error) {
      throw new Error('Failed to fetch user information');
    }

    // Prepare email data
    const emailData = {
      feedbackId: feedback.id,
      recipientEmail: recipientResult.data.email,
      recipientName: recipientResult.data.full_name,
      senderName: senderResult.data.full_name,
      feedbackText: feedback.modified_text || feedback.original_text,
      createdAt: feedback.created_at,
    };

    // Send email notification
    await sendFeedbackDeliveredEmail(emailData);
  } catch (error) {
    console.error('Error in notifyFeedbackDelivered:', error);
    // Don't throw - email notification failure shouldn't break the main flow
  }
}

