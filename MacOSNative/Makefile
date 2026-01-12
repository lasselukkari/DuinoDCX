# DuinoDCX macOS Native Build
# This Makefile builds DuinoDCX to run natively on macOS

CXX = clang++
CXXFLAGS = -std=c++11 -Wall -Wextra -O2 -Wno-nonportable-include-path

# Include paths
# -include forces Arduino.h to be included first in all compilation units
INCLUDES = -include Arduino.h \
           -I. \
           -I../DuinoDCX \
           -isystem ArduinoCore-API/api \
           -isystem ArduinoCore-API/api/deprecated-avr-comp

# Arduino core source files
ARDUINO_SOURCES = ArduinoCore-API/api/Print.cpp \
                  ArduinoCore-API/api/Stream.cpp \
                  ArduinoCore-API/api/WString.cpp \
                  ArduinoCore-API/api/IPAddress.cpp \
                  ArduinoCore-API/api/Common.cpp

# DuinoDCX source files (from parent directory)
DUINODCX_SOURCES = ../DuinoDCX/App.cpp \
                   ../DuinoDCX/Request.cpp \
                   ../DuinoDCX/Response.cpp \
                   ../DuinoDCX/Response.cpp \
                   ../DuinoDCX/Router.cpp \
                   ../DuinoDCX/RouteHandlers.cpp

# Platform adapter source files
PLATFORM_SOURCES = MacOSSocket.cpp \
                   MacOSSerial.cpp

# Main application - now using unified DuinoDCX.ino
APP_SOURCES = ../DuinoDCX/DuinoDCX.ino

# Object files
ARDUINO_OBJECTS = Print.o Stream.o WString.o IPAddress.o Common.o
DUINODCX_OBJECTS = App.o Request.o Response.o Router.o RouteHandlers.o
PLATFORM_OBJECTS = MacOSSocket.o MacOSSerial.o
APP_OBJECTS = DuinoDCX.o

ALL_OBJECTS = $(ARDUINO_OBJECTS) $(DUINODCX_OBJECTS) $(PLATFORM_OBJECTS) $(APP_OBJECTS)

# Target executable
TARGET = DuinoDCXMac

.PHONY: all clean run setup help

all: $(TARGET)

$(TARGET): $(ALL_OBJECTS)
	$(CXX) $(CXXFLAGS) -o $@ $^

# Arduino Core objects
Print.o: ArduinoCore-API/api/Print.cpp
	$(CXX) $(CXXFLAGS) $(INCLUDES) -c -o $@ $<

Stream.o: ArduinoCore-API/api/Stream.cpp
	$(CXX) $(CXXFLAGS) $(INCLUDES) -c -o $@ $<

WString.o: ArduinoCore-API/api/WString.cpp
	$(CXX) $(CXXFLAGS) $(INCLUDES) -c -o $@ $<

IPAddress.o: ArduinoCore-API/api/IPAddress.cpp
	$(CXX) $(CXXFLAGS) $(INCLUDES) -c -o $@ $<

Common.o: ArduinoCore-API/api/Common.cpp
	$(CXX) $(CXXFLAGS) $(INCLUDES) -c -o $@ $<

# DuinoDCX objects
App.o: ../DuinoDCX/App.cpp
	$(CXX) $(CXXFLAGS) $(INCLUDES) -c -o $@ $<

Request.o: ../DuinoDCX/Request.cpp
	$(CXX) $(CXXFLAGS) $(INCLUDES) -c -o $@ $<

Response.o: ../DuinoDCX/Response.cpp
	$(CXX) $(CXXFLAGS) $(INCLUDES) -c -o $@ $<

Router.o: ../DuinoDCX/Router.cpp
	$(CXX) $(CXXFLAGS) $(INCLUDES) -c -o $@ $<

RouteHandlers.o: ../DuinoDCX/RouteHandlers.cpp
	$(CXX) $(CXXFLAGS) $(INCLUDES) -c -o $@ $<

# Platform adapter objects
MacOSSocket.o: MacOSSocket.cpp
	$(CXX) $(CXXFLAGS) $(INCLUDES) -c -o $@ $<

MacOSSerial.o: MacOSSerial.cpp
	$(CXX) $(CXXFLAGS) $(INCLUDES) -c -o $@ $<

# Application object - compile .ino as C++
DuinoDCX.o: ../DuinoDCX/DuinoDCX.ino
	$(CXX) $(CXXFLAGS) $(INCLUDES) -x c++ -c -o $@ $<

clean:
	rm -f $(TARGET) *.o

run: $(TARGET)
	./$(TARGET)

# Setup ArduinoCore-API if not present
setup:
	@if [ ! -d "ArduinoCore-API" ]; then \
		echo "Cloning ArduinoCore-API..."; \
		git clone --depth 1 https://github.com/arduino/ArduinoCore-API.git; \
	else \
		echo "ArduinoCore-API already present"; \
	fi

help:
	@echo "DuinoDCX macOS Native Build"
	@echo ""
	@echo "Targets:"
	@echo "  all    - Build the application (default)"
	@echo "  setup  - Clone ArduinoCore-API if not present"
	@echo "  run    - Build and run the application"
	@echo "  clean  - Remove built files"
	@echo "  help   - Show this help"
	@echo ""
	@echo "Usage:"
	@echo "  make setup     # First time setup"
	@echo "  make           # Build"
	@echo "  ./DuinoDCXMac /dev/cu.usbserial-1430"
