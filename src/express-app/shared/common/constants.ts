export enum RESULT_STATUS {
  FAILED = 0,
  SUCCESS = 1,
}

export enum MESSAGES {
  SUCCESS = 'Success',
  FAILED = 'Failed',
  NOT_FOUND = 'Not Found',
  USER_NOT_FOUND = 'User not found',
  LEARNING_PROGRESS_NOT_FOUND = 'Learning progress not found',
  QUIZ_NOT_FOUND = 'Quiz not found',

  COURSE_NOT_FOUND = 'Course not found',
  COURSE_NOT_APPROVED = 'Course must be approved before uploading final test',
  COULD_NOT_REFRESH_TOKEN = 'Could not refresh token',
  EMAIL_NOT_FOUND = 'Email not found',

  FINAL_TEST_NOT_FOUND = 'Final test not found',
  FINAL_TEST_EXISTS = 'Final test already exists',
  FINAL_TEST_DELETED_SUCCESSFULLY = 'Final test deleted successfully',
  FINAL_TEST_EDITED_SUCCESSFULLY = 'Final test edited successfully'

}
