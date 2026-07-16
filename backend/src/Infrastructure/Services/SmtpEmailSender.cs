using System.Net;
using System.Net.Mail;
using Application.Interfaces;
using Microsoft.Extensions.Configuration;

namespace Infrastructure.Services;

public sealed class SmtpEmailSender : IEmailSender
{
    private readonly IConfiguration _config;

    public SmtpEmailSender(IConfiguration config) => _config = config;

    public async Task SendEmailAsync(string toEmail, string subject, string htmlBody)
    {
        var host = _config["Smtp:Host"];
        var port = int.TryParse(_config["Smtp:Port"], out var p) ? p : 25;
        var user = _config["Smtp:User"];
        var pass = _config["Smtp:Password"];
        var fromEmail = _config["Smtp:FromEmail"];
        var fromName = _config["Smtp:FromName"] ?? fromEmail;

        if (string.IsNullOrWhiteSpace(host) ||
            string.IsNullOrWhiteSpace(fromEmail) ||
            string.IsNullOrWhiteSpace(toEmail))
        {
            throw new InvalidOperationException("SMTP is not configured. Check Smtp:Host and Smtp:FromEmail.");
        }

        using var message = new MailMessage
        {
            From = new MailAddress(fromEmail, fromName),
            Subject = subject,
            Body = htmlBody,
            IsBodyHtml = true,
        };
        message.To.Add(toEmail);

        using var client = new SmtpClient(host, port)
        {
            EnableSsl = true
        };

        if (!string.IsNullOrWhiteSpace(user) && !string.IsNullOrWhiteSpace(pass))
        {
            client.Credentials = new NetworkCredential(user, pass);
        }

        await client.SendMailAsync(message);
    }
}
