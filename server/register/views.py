from django.shortcuts import render, redirect
from .forms import RegisterForm
from django.contrib import messages


# Create your views here.
def register(response):
    if response.method == "POST":
        form = RegisterForm(response.POST)
        if form.is_valid():
            username = form.cleaned_data.get('username')
            messages.success(response, f'Successfully created user {username}')
            form.save()
            return redirect("/")
    else:
        form = RegisterForm()

    return render(response, "register.html", {"form": form,
                                              "title": 'Register'})
