// Modern event handling for the Banner App
document.addEventListener('DOMContentLoaded', function() {
  console.log('Content script loaded');
  
  // Use beforeunload instead of unload for any cleanup operations
  window.addEventListener('beforeunload', function(event) {
    // Perform any necessary cleanup here
    console.log('Page is about to unload');
    
    // No need to return anything - modern browsers handle this automatically
  });
}); 