
UPDATE listings SET is_featured = true WHERE id IN (
  '7ffddf95-408f-4269-bfd1-bb0c574a25f5',
  'd32eadd5-9588-4ab1-9559-889ce83aeef3',
  'd6d3f4b0-ca76-4f93-aad1-aad4b04df821',
  '74ca7010-36f2-48e9-807c-15dc97325d0f',
  '908360d9-899d-4a5c-b45a-4173cdc48d92',
  '02d2a553-0ef4-41c5-85a3-5b02c67d624d'
);

UPDATE listings SET is_featured = false WHERE id IN (
  '49545e47-a417-4a43-b55f-c52d08467d2d',
  '041bf7ea-927b-4064-bac2-f7ca4daa2580'
);
