import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { SAVE_BOOK } from '../utils/mutations';
import { Container, Col, Form, Button, Card, Row } from 'react-bootstrap';
import Auth from '../utils/auth';
import { searchGoogleBooks } from '../utils/API'; // We are not using saveBook anymore
import { saveBookIds, getSavedBookIds } from '../utils/localStorage';

const SearchBooks = () => {
  const [searchedBooks, setSearchedBooks] = useState([]);
  const [searchInput, setSearchInput] = useState('');

  const [saveBook] = useMutation(SAVE_BOOK);

  const handleInputChange = (event) => {
    setSearchInput(event.target.value);
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();

    try {
      const response = await searchGoogleBooks(searchInput);

      if (!response.ok) {
        throw new Error('Something went wrong!');
      }

      const { items } = await response.json();

      const bookData = items.map((book) => ({
        bookId: book.id,
        authors: book.volumeInfo.authors || ['No Author Available'],
        description: book.volumeInfo.description,
        title: book.volumeInfo.title,
        image: book.volumeInfo.imageLinks?.thumbnail || '',
        link: book.volumeInfo.infoLink,
      }));

      setSearchedBooks(bookData);
      setSearchInput('');
    } catch (error) {
      console.error(error);
    }
  };

  const handleSaveBook = async (bookId) => {
    const bookToSave = searchedBooks.find((book) => book.bookId === bookId);

    if (bookToSave) {
      try {
        const { data } = await saveBook({
          variables: { input: bookToSave },
        });

        if (!Auth.loggedIn()) {
          throw new Error('You need to be logged in to save a book!');
        }

        const bookId = data.saveBook._id;

        saveBookIds(bookId);
      } catch (error) {
        console.error(error);
      }
    }
  };

  return (
    <Container>
      <h2>Search for Books</h2>
      <Form onSubmit={handleFormSubmit}>
        <Form.Row>
          <Col xs={12} md={8}>
            <Form.Control
              name="searchInput"
              value={searchInput}
              onChange={handleInputChange}
              type="text"
              size="lg"
              placeholder="Search for a book"
            />
          </Col>
          <Col xs={12} md={4}>
            <Button type="submit" variant="success" size="lg" block>
              Search
            </Button>
          </Col>
        </Form.Row>
      </Form>
      <Row>
        {searchedBooks.map((book) => {
          return (
            <Col key={book.bookId} xs={12} md={6} lg={4} xl={3}>
              <Card>
                <Card.Img src={book.image} alt={`${book.title} cover`} />
                <Card.Body>
                  <Card.Title>{book.title}</Card.Title>
                  <p className="small">Authors: {book.authors.join(', ')}</p>
                  <Card.Text>{book.description}</Card.Text>
                  <Button
                    variant="primary"
                    onClick={() => handleSaveBook(book.bookId)}
                  >
                    Save
                  </Button>
                  <Card.Link href={book.link} target="_blank">
                    View on Google Books
                  </Card.Link>
                </Card.Body>
              </Card>
            </Col>
          );
        })}
      </Row>
    </Container>
  );
};

export default SearchBooks;
