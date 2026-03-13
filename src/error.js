const handleError = (err) => {
    if (err.response) {
      const data = err.response.data;
  
      const message =
        data.message ||
        data.error ||
        data.msg ||
        JSON.stringify(data);
  
      setError(message);
    } else if (err.request) {
      setError("Server not responding");
    } else {
      setError(err.message);
    }
  };