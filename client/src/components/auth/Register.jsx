// frontend/src/components/auth/Register.jsx

import React, { useState, useContext, useEffect } from "react";
import { useTranslation } from "../../i18n/hooks/useTranslation";
import {
  Form,
  Button,
  Card,
  Container,
  Row,
  Col,
  Spinner,
  Alert,
} from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../contexts/AuthContext";
import { AlertContext } from "../../contexts/AlertContext";
import PasswordStrengthMeter from "./PasswordStrengthMeter";

const Register = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    fullName: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordErrors, setPasswordErrors] = useState([]);
  const [validationError, setValidationError] = useState(null);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(5);

  const { register, error, setError } = useContext(AuthContext);
  const { error: showError, success: showSuccess } = useContext(AlertContext);

  const navigate = useNavigate();

  const { username, email, fullName, password, confirmPassword } = formData;

  // Handle authentication errors
  useEffect(() => {
    if (error) {
      setValidationError(error);
      showError(error);
      setError(null);
    }
  }, [error, showError, setError]);

  useEffect(() => {
    const validatePassword = (password) => {
      if (!password) {
        setPasswordStrength(0);
        setPasswordErrors([]);
        setValidationError(null);
        return;
      }

      const errors = [];
      let strength = 0;

      // Check length (0-30 points)
      if (password.length < 8) {
        errors.push("Password must be at least 8 characters long");
      } else if (password.length >= 12) {
        strength += 30; // Excellent length
      } else if (password.length >= 10) {
        strength += 25; // Good length
      } else {
        strength += 15; // Minimum acceptable length
      }

      // Check for uppercase letter (0-20 points)
      if (!/[A-Z]/.test(password)) {
        errors.push("Password must contain at least one uppercase letter");
      } else {
        strength += 20;
      }

      // Check for lowercase letter (0-20 points)
      if (!/[a-z]/.test(password)) {
        errors.push("Password must contain at least one lowercase letter");
      } else {
        strength += 20;
      }

      // Check for number (0-15 points)
      if (!/\d/.test(password)) {
        errors.push("Password must contain at least one number");
      } else {
        strength += 15;
      }

      // Check for special character (0-15 points)
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.push("Password must contain at least one special character");
      } else {
        strength += 15;
      }

      // Bonus points for complexity
      const uniqueChars = new Set(password).size;
      if (uniqueChars >= password.length * 0.7) {
        strength += 5; // Good character diversity
      }

      // Bonus for mixed case + numbers + symbols
      if (
        /[A-Z]/.test(password) &&
        /[a-z]/.test(password) &&
        /\d/.test(password) &&
        /[!@#$%^&*(),.?":{}|<>]/.test(password)
      ) {
        strength += 5; // Bonus for using all character types
      }

      // Cap at 100
      strength = Math.min(strength, 100);

      setPasswordStrength(strength);
      setPasswordErrors(errors);
      setValidationError(null);
    };

    validatePassword(password);
  }, [password]);

  const validateForm = () => {
    const errors = {};

    if (!username.trim()) {
      errors.username = "Username is required";
    } else if (username.length < 3) {
      errors.username = "Username must be at least 3 characters";
    }

    if (!email.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = "Email is invalid";
    }

    if (!fullName.trim()) {
      errors.fullName = "Full name is required";
    }

    if (!password) {
      errors.password = "Password is required";
    } else if (passwordErrors.length > 0) {
      errors.password = "Password does not meet requirements";
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: null });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setValidationError(null);

    try {
      const response = await register(formData);
      if (response.success) {
        // Set registration success state
        setRegistrationSuccess(true);

        // Show success message with user's name
        const userName = formData.fullName || formData.username;
        showSuccess(
          `Welcome ${userName}! Your account has been created successfully.`
        );

        // Start countdown timer
        let countdown = 5;
        setRedirectCountdown(countdown);

        const timer = setInterval(() => {
          countdown -= 1;
          setRedirectCountdown(countdown);

          if (countdown <= 0) {
            clearInterval(timer);
            navigate("/login", {
              state: {
                message: "Please log in with your new account credentials.",
                email: formData.email,
              },
            });
          }
        }, 1000);
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Registration failed. Please try again.";
      showError(errorMessage);
      setValidationError(errorMessage);
      setRegistrationSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-5 auth-container">
      <Row className="justify-content-center">
        <Col md={6}>
          <Card>
            <Card.Body>
              <h2 className="text-center mb-4">
                {t("auth.register", {}, "Kayıt Ol")}
              </h2>

              {validationError && (
                <Alert
                  variant="danger"
                  onClose={() => setValidationError(null)}
                  dismissible
                >
                  {validationError}
                </Alert>
              )}

              {registrationSuccess && (
                <Alert variant="success" className="text-center">
                  <Alert.Heading>
                    🎉 {t("auth.registrationSuccessful", {}, "Kayıt Başarılı!")}
                  </Alert.Heading>
                  <p>
                    {t(
                      "auth.accountCreated",
                      {},
                      "Hesabınız başarıyla oluşturuldu."
                    )}
                  </p>
                  <hr />
                  <p className="mb-0">
                    {t(
                      "auth.redirectingToLogin",
                      {},
                      "Giriş sayfasına yönlendiriliyorsunuz"
                    )}{" "}
                    <strong>{redirectCountdown}</strong>{" "}
                    {t("auth.seconds", {}, "saniye...")}
                  </p>
                  <Button
                    variant="outline-success"
                    size="sm"
                    className="mt-2"
                    onClick={() =>
                      navigate("/login", {
                        state: {
                          message: t(
                            "auth.loginWithNewCredentials",
                            {},
                            "Lütfen yeni hesap bilgilerinizle giriş yapın."
                          ),
                          email: formData.email,
                        },
                      })
                    }
                  >
                    {t("auth.goToLoginNow", {}, "Şimdi Giriş Yap")}
                  </Button>
                </Alert>
              )}

              <Form
                onSubmit={handleSubmit}
                style={{ display: registrationSuccess ? "none" : "block" }}
              >
                <Form.Group className="mb-3">
                  <Form.Label>
                    {t("auth.username", {}, "Kullanıcı Adı")}
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="username"
                    value={username}
                    onChange={handleChange}
                    isInvalid={!!formErrors.username}
                    disabled={loading}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.username}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>{t("auth.email", {}, "E-posta")}</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={email}
                    onChange={handleChange}
                    isInvalid={!!formErrors.email}
                    disabled={loading}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.email}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>{t("auth.fullName", {}, "Ad Soyad")}</Form.Label>
                  <Form.Control
                    type="text"
                    name="fullName"
                    value={fullName}
                    onChange={handleChange}
                    isInvalid={!!formErrors.fullName}
                    disabled={loading}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.fullName}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>{t("auth.password", {}, "Şifre")}</Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={password}
                    onChange={handleChange}
                    isInvalid={!!formErrors.password}
                    disabled={loading}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.password}
                  </Form.Control.Feedback>
                  <PasswordStrengthMeter
                    strength={passwordStrength}
                    errors={passwordErrors}
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>
                    {t("auth.confirmPassword", {}, "Şifre Tekrar")}
                  </Form.Label>
                  <Form.Control
                    type="password"
                    name="confirmPassword"
                    value={confirmPassword}
                    onChange={handleChange}
                    isInvalid={!!formErrors.confirmPassword}
                    disabled={loading}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.confirmPassword}
                  </Form.Control.Feedback>
                </Form.Group>

                <Button
                  variant="primary"
                  type="submit"
                  className="w-100"
                  disabled={loading || passwordErrors.length > 0}
                >
                  {loading ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                        className="me-2"
                      />
                      {t("auth.registering", {}, "Kayıt yapılıyor...")}
                    </>
                  ) : (
                    t("auth.register", {}, "Kayıt Ol")
                  )}
                </Button>
              </Form>

              <div className="text-center mt-3">
                <Link to="/login">
                  {t(
                    "auth.alreadyHaveAccount",
                    {},
                    "Zaten hesabınız var mı? Giriş Yap"
                  )}
                </Link>
              </div>
            </Card.Body>
          </Card>

          {/* Copyright Footer */}
          <div className="text-center mt-4">
            <div className="text-muted small">
              <p className="mb-1">
                © {new Date().getFullYear()} Pazar+ by{" "}
                <a
                  href="https://github.com/Great0S"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-decoration-none fw-bold text-primary"
                >
                  Great0S
                </a>
                . All rights reserved.
              </p>
              <p className="mb-0">
                All work is property of{" "}
                <a
                  href="https://github.com/Great0S"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-decoration-none fw-bold text-primary"
                >
                  Great0S
                </a>
                . Licensed under MIT License.
              </p>
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default Register;
